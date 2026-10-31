import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
import { subscriberState, webhookUserIds } from '../_shared/revenuecat.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const auth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  const apiKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!auth || !apiKey) return new Response('Webhook configuration missing', { status: 503 });
  const expected = auth.startsWith('Bearer ') ? auth : `Bearer ${auth}`;
  if (req.headers.get('authorization') !== expected)
    return new Response('Unauthorized', { status: 401 });
  let event;
  try {
    event = (await req.json()).event;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!event?.type || !event?.id) return new Response('Invalid event', { status: 400 });
  if (event.type === 'TEST') return Response.json({ received: true });
  // Ignore unrelated entitlements; TRANSFER does not carry entitlement_ids.
  if (event.type !== 'TRANSFER' && !event.entitlement_ids?.includes('premium')) {
    return Response.json({ received: true, ignored: true });
  }
  if (event.environment === 'SANDBOX' && Deno.env.get('REVENUECAT_ALLOW_SANDBOX') !== 'true') {
    return Response.json({ received: true, ignored: 'sandbox' });
  }
  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    // Reconcile the current subscriber snapshot, rather than trusting event order.
    // A transfer reconciles both previous and new owners. Retries are idempotent.
    for (const userId of webhookUserIds(event)) {
      const { data: user, error: userError } = await sb.auth.admin.getUserById(userId);
      if (userError?.status === 404 || !user?.user) continue; // account already deleted
      if (userError) throw userError;
      const fetchedAt = new Date().toISOString();
      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error(`RevenueCat subscriber lookup returned ${response.status}`);
      const { subscriber } = await response.json();
      if (!subscriber) throw new Error('RevenueCat subscriber snapshot missing');
      const state = subscriberState(subscriber);
      if (state?.environment === 'SANDBOX' && Deno.env.get('REVENUECAT_ALLOW_SANDBOX') !== 'true')
        continue;
      const { error } = await sb.rpc('sync_revenuecat_subscription', {
        p_user_id: userId,
        p_state: state,
        p_synced_at: fetchedAt,
      });
      if (error) throw error;
    }
    return Response.json({ received: true });
  } catch (err) {
    console.error('[revenuecat-webhook] Synchronization failed', err);
    // Non-200 tells RevenueCat to retry; do not acknowledge failed DB writes.
    return Response.json({ error: 'Subscription synchronization failed' }, { status: 500 });
  }
});
