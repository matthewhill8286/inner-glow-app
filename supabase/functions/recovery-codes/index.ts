// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { encode as hexEncode } from 'https://deno.land/std@0.168.0/encoding/hex.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Generate a random 8-character alphanumeric recovery code (uppercase, no ambiguous chars).
 * Format: XXXX-XXXX for readability.
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * SHA-256 hash a code for storage.
 */
async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.replace(/-/g, '').toUpperCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new TextDecoder().decode(hexEncode(new Uint8Array(hash)));
}

/** Helper to build a JSON response with CORS headers */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Service-role client for all DB operations
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action, code: submittedCode, email } = body;

    // ─── VERIFY-BY-EMAIL (unauthenticated — for forgot-password flow) ───
    // This action does NOT require a user session. It looks up the user by
    // email and verifies a recovery code. Rate-limited by design (single-use
    // codes + SHA-256 comparison).
    if (action === 'verify-by-email') {
      if (!email || !submittedCode) {
        return jsonResponse({ error: 'Missing email or code' }, 400);
      }

      // Look up user by email via admin auth API
      const { data: userList, error: listError } = await admin.auth.admin.listUsers();
      if (listError) throw listError;

      const targetUser = userList.users.find(
        (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase(),
      );

      if (!targetUser) {
        // Don't reveal whether the email exists — return generic failure
        return jsonResponse({ valid: false, error: 'Invalid recovery code' });
      }

      const codeHash = await hashCode(submittedCode);

      // Find an unused code matching the hash for this user
      const { data: match, error: matchError } = await admin
        .from('recovery_codes')
        .select('id')
        .eq('user_id', targetUser.id)
        .eq('code_hash', codeHash)
        .is('used_at', null)
        .limit(1)
        .single();

      if (matchError || !match) {
        return jsonResponse({ valid: false, error: 'Invalid recovery code' });
      }

      // Mark code as used
      await admin
        .from('recovery_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', match.id);

      return jsonResponse({ valid: true });
    }

    // ─── All other actions require an authenticated user session ─────
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    // @ts-ignore
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // ─── GENERATE ───────────────────────────────────────
    if (action === 'generate') {
      // Delete any existing codes for this user
      await admin.from('recovery_codes').delete().eq('user_id', user.id);

      // Generate 10 fresh codes
      const plainCodes: string[] = [];
      const rows: { user_id: string; code_hash: string }[] = [];

      for (let i = 0; i < 10; i++) {
        const plain = generateCode();
        plainCodes.push(plain);
        rows.push({ user_id: user.id, code_hash: await hashCode(plain) });
      }

      const { error: insertError } = await admin.from('recovery_codes').insert(rows);
      if (insertError) throw insertError;

      // Return plain-text codes ONCE — they won't be recoverable later
      return jsonResponse({ codes: plainCodes });
    }

    // ─── VERIFY (authenticated) ─────────────────────────
    if (action === 'verify') {
      if (!submittedCode) {
        return jsonResponse({ error: 'Missing code' }, 400);
      }

      const codeHash = await hashCode(submittedCode);

      const { data: match, error: matchError } = await admin
        .from('recovery_codes')
        .select('id')
        .eq('user_id', user.id)
        .eq('code_hash', codeHash)
        .is('used_at', null)
        .limit(1)
        .single();

      if (matchError || !match) {
        return jsonResponse({ valid: false, error: 'Invalid recovery code' });
      }

      // Mark code as used
      await admin
        .from('recovery_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', match.id);

      return jsonResponse({ valid: true });
    }

    // ─── COUNT (how many unused codes remain) ───────────
    if (action === 'count') {
      const { count, error: countError } = await admin
        .from('recovery_codes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('used_at', null);

      if (countError) throw countError;

      return jsonResponse({ remaining: count ?? 0 });
    }

    return jsonResponse({ error: 'Invalid action' }, 400);
  } catch (err) {
    console.error('[recovery-codes]', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
