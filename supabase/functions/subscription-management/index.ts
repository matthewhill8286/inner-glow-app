import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const appleURL = 'https://apps.apple.com/account/subscriptions';
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST')
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  const token = req.headers.get('authorization')?.replace(/^Bearer /i, '');
  if (!token) return Response.json({ error: 'Please sign in first.' }, { status: 401, headers });
  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const {
      data: { user },
      error: authError,
    } = await sb.auth.getUser(token);
    if (authError || !user)
      return Response.json({ error: 'Please sign in again.' }, { status: 401, headers });
    const { data: subscription, error } = await sb
      .from('subscriptions')
      .select('provider,store,stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (subscription?.provider === 'revenuecat' || subscription?.store === 'app_store')
      return Response.json({ provider: 'apple', url: appleURL }, { headers });
    if (!subscription?.stripe_customer_id)
      return Response.json(
        { error: 'No paid subscription is linked to this account.' },
        { status: 404, headers },
      );
    const { returnUrl } = await req.json();
    const redirect = new URL(returnUrl);
    const local = ['localhost', '127.0.0.1'].includes(redirect.hostname);
    const approved =
      local ||
      [
        'innerglowapp.com',
        'www.innerglowapp.com',
        'inner-glow-wellness.bushy-lynx-1749.chatgpt.site',
      ].includes(redirect.hostname);
    if (!approved || !(redirect.protocol === 'https:' || (local && redirect.protocol === 'http:')))
      return Response.json({ error: 'Invalid return address.' }, { status: 400, headers });
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!key) throw new Error('Billing management is not configured');
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: subscription.stripe_customer_id,
        return_url: redirect.href,
      }),
    });
    const portal = await response.json();
    if (!response.ok || typeof portal.url !== 'string') throw new Error('Portal unavailable');
    return Response.json({ provider: 'stripe', url: portal.url }, { headers });
  } catch {
    return Response.json(
      { error: 'Unable to open subscription settings. Please try again.' },
      { status: 503, headers },
    );
  }
});
