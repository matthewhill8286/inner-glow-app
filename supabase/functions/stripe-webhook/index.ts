// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
// @ts-ignore
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

/**
 * stripe-webhook
 *
 * Handles Stripe webhook events to update subscription status.
 *
 * Events handled:
 *   - checkout.session.completed  → activate subscription
 *   - customer.subscription.deleted → cancel subscription
 *   - invoice.payment_failed → mark as past_due
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    // @ts-ignore
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    // ── Verify webhook signature (if secret configured) ──
    if (webhookSecret && sig) {
      const verified = await verifyStripeSignature(rawBody, sig, webhookSecret);
      if (!verified) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    const event = JSON.parse(rawBody);
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.user_id;
        const plan = session.metadata?.plan || 'monthly';

        if (!userId) {
          console.warn('No user_id in checkout session metadata');
          break;
        }

        // Calculate expiry
        let expiryDate: string | null = null;
        if (plan === 'monthly') {
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + 1);
          expiryDate = expiry.toISOString();
        }
        // lifetime has no expiry

        // Update subscriptions table
        await sb.from('subscriptions').upsert(
          {
            user_id: userId,
            plan,
            status: 'active',
            stripe_session_id: session.id,
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null,
            current_period_end: expiryDate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );

        // Also update the profiles table
        await sb.from('profiles').update({
          subscription_type: plan,
          subscription_expiry: expiryDate,
        }).eq('id', userId);

        console.log(`Subscription activated for user ${userId}: ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Look up user by customer ID
        const { data: sub } = await sb
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub?.user_id) {
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          await sb.from('subscriptions').update({
            status: subscription.cancel_at_period_end ? 'canceling' : 'active',
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id);

          await sb.from('profiles').update({
            subscription_expiry: periodEnd,
          }).eq('id', sub.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: sub } = await sb
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub?.user_id) {
          await sb.from('subscriptions').update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id);

          await sb.from('profiles').update({
            subscription_type: 'expired',
            subscription_expiry: new Date().toISOString(),
          }).eq('id', sub.user_id);

          console.log(`Subscription canceled for user ${sub.user_id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: sub } = await sb
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub?.user_id) {
          await sb.from('subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id);

          console.log(`Payment failed for user ${sub.user_id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('stripe-webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

/**
 * Verify Stripe webhook signature using HMAC-SHA256.
 * Stripe sends `t=<timestamp>,v1=<signature>` in the Stripe-Signature header.
 */
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = sigHeader.split(',');
    const tPart = parts.find((p: string) => p.startsWith('t='));
    const v1Part = parts.find((p: string) => p.startsWith('v1='));

    if (!tPart || !v1Part) return false;

    const timestamp = tPart.split('=')[1];
    const signature = v1Part.split('=')[1];

    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computed = Array.from(new Uint8Array(mac))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');

    return computed === signature;
  } catch {
    return false;
  }
}
