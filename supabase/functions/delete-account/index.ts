import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const token = req.headers.get('authorization')?.replace(/^Bearer /i, '');
  if (!token) return Response.json({ error: 'Authentication required' }, { status: 401, headers });
  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token);
  if (error || !user)
    return Response.json({ error: 'Authentication required' }, { status: 401, headers });
  try {
    const body = await req.json();
    if (body.confirmation !== 'DELETE')
      return Response.json({ error: 'Deletion confirmation required' }, { status: 400, headers });
    // Profile photos live in Storage, which the RPC refuses to orphan, so remove them first.
    const { data: photos, error: listError } = await sb.storage.from('avatars').list(user.id);
    if (listError) throw listError;
    if (photos?.length) {
      const { error: removeError } = await sb.storage
        .from('avatars')
        .remove(photos.map((photo) => `${user.id}/${photo.name}`));
      if (removeError) throw removeError;
    }
    // The RPC deletes all app rows and the auth account in one transaction.
    // A failure rolls back rather than leaving a partially deleted account.
    const { error: deleteError } = await sb.rpc('delete_innerglow_account', { p_user_id: user.id });
    if (deleteError) throw deleteError;
    return Response.json({ deleted: true }, { headers });
  } catch (err) {
    console.error('[delete-account]', err);
    return Response.json(
      { error: 'Unable to delete your account. Please contact support or retry.' },
      { status: 500, headers },
    );
  }
});
