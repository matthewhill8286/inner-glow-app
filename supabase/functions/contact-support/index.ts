import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
Deno.serve(async (req: Request) => {
  const siteOrigin = Deno.env.get('SUPPORT_SITE_ORIGIN');
  const origin = req.headers.get('origin');
  const cors = {
    'Access-Control-Allow-Origin': siteOrigin ?? '',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
    Vary: 'Origin',
  };
  if (!siteOrigin)
    return Response.json({ error: 'Support is temporarily unavailable' }, { status: 503 });
  if (origin && origin !== siteOrigin) return new Response('Origin not allowed', { status: 403 });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405, headers: cors });
  try {
    const raw = await req.text();
    if (raw.length > 12000)
      return Response.json({ error: 'Message is too long' }, { status: 413, headers: cors });
    const body = JSON.parse(raw);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      message.length < 20 ||
      message.length > 5000 ||
      body.consent !== true
    ) {
      return Response.json(
        {
          error:
            'Enter a valid email, a message of 20 to 5000 characters, and accept the privacy notice.',
        },
        { status: 400, headers: cors },
      );
    }
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${secret}:${ip}`),
    );
    const sourceHash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, secret);
    let userId = null;
    const token = req.headers.get('authorization')?.replace(/^Bearer /i, '');
    if (token) {
      const {
        data: { user },
      } = await sb.auth.getUser(token);
      userId = user?.id ?? null;
    }
    const { data, error } = await sb.rpc('submit_support_request', {
      p_email: email,
      p_message: message,
      p_source_hash: sourceHash,
      p_user_id: userId,
    });
    if (error) {
      if (error.message.includes('Too many'))
        return Response.json(
          { error: 'Too many requests. Please try again in one hour.' },
          { status: 429, headers: cors },
        );
      throw error;
    }
    return Response.json({ received: true, reference: data }, { headers: cors });
  } catch (err) {
    console.error('[contact-support]', err);
    return Response.json(
      { error: 'Unable to save your request. Please try again.' },
      { status: 503, headers: cors },
    );
  }
});
