import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { safeDiagnostic } from '../../../lib/diagnostic-events.ts';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const windows = new Map<string, { at: number; count: number }>();
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  const reply = (status: number, body: unknown) => Response.json(body, { status, headers });
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'Sign in required' });
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const {
    data: { user },
    error,
  } = await client.auth.getUser(authorization.slice(7));
  if (error || !user) return reply(401, { error: 'Sign in required' });
  const now = Date.now(),
    window = windows.get(user.id);
  if (window && now - window.at < 60000 && window.count >= 10)
    return reply(429, { error: 'Please try later' });
  if (windows.size > 1000) windows.clear();
  windows.set(user.id, {
    at: window && now - window.at < 60000 ? window.at : now,
    count: window && now - window.at < 60000 ? window.count + 1 : 1,
  });
  const text = await request.text();
  if (text.length > 1024) return reply(413, { error: 'Payload too large' });
  let item;
  try {
    item = safeDiagnostic(JSON.parse(text));
  } catch {
    return reply(400, { error: 'Invalid diagnostic' });
  }
  if (!item) return reply(400, { error: 'Invalid diagnostic' });
  // Explicit projection excludes user IDs, exception text, URLs, headers and app content.
  console.log(JSON.stringify({ kind: 'client_diagnostic', ...item }));
  return reply(202, { accepted: true, reference: item.reference });
});
