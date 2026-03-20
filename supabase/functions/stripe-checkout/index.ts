// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * stripe-checkout
 *
 * Creates a Stripe Checkout Session for subscription or one-time payment.
 *
 * Expects JSON body:
 *   { plan: 'monthly' | 'lifetime', userId: string }
 *
 * Returns:
 *   { url: string, sessionId: string }
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const body = await req.json();
    const { plan, userId, successUrl, cancelUrl } = body;

    if (!plan || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: plan, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Plan configuration ──────────────────────────
    const PLANS: Record<string, {
      mode: 'subscription' | 'payment';
      amount: number;
      currency: string;
      name: string;
      interval?: string;
    }> = {
      monthly: {
        mode: 'subscription',
        amount: 1000, // €10.00
        currency: 'eur',
        name: 'Freud Premium — Monthly',
        interval: 'month',
      },
      lifetime: {
        mode: 'payment',
        amount: 7200, // €72.00
        currency: 'eur',
        name: 'Freud Premium — Lifetime',
      },
    };

    const planConfig = PLANS[plan];
    if (!planConfig) {
      return new Response(
        JSON.stringify({ error: `Invalid plan: ${plan}. Must be "monthly" or "lifetime".` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Build Stripe line item ──────────────────────
    const lineItem: Record<string, any> = {
      price_data: {
        currency: planConfig.currency,
        product_data: { name: planConfig.name },
        unit_amount: planConfig.amount,
        ...(planConfig.mode === 'subscription' && planConfig.interval
          ? { recurring: { interval: planConfig.interval } }
          : {}),
      },
      quantity: 1,
    };

    // ── Create Stripe Checkout Session via REST API ─
    const stripeBody = new URLSearchParams();
    stripeBody.append('mode', planConfig.mode);
    stripeBody.append('line_items[0][price_data][currency]', planConfig.currency);
    stripeBody.append('line_items[0][price_data][product_data][name]', planConfig.name);
    stripeBody.append('line_items[0][price_data][unit_amount]', String(planConfig.amount));
    if (planConfig.mode === 'subscription' && planConfig.interval) {
      stripeBody.append(
        'line_items[0][price_data][recurring][interval]',
        planConfig.interval,
      );
    }
    stripeBody.append('line_items[0][quantity]', '1');
    stripeBody.append('success_url', successUrl || 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}');
    stripeBody.append('cancel_url', cancelUrl || 'https://example.com/cancel');
    stripeBody.append('client_reference_id', userId);
    stripeBody.append('metadata[plan]', plan);
    stripeBody.append('metadata[user_id]', userId);

    // Allow promotion codes
    stripeBody.append('allow_promotion_codes', 'true');

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeBody.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe error:', session);
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Stripe API error' }),
        { status: stripeRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Record pending checkout in Supabase ─────────
    if (supabaseUrl && supabaseServiceKey) {
      const sb = createClient(supabaseUrl, supabaseServiceKey);
      await sb.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_session_id: session.id,
          plan,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      ).catch((err: any) => console.warn('Failed to record pending checkout:', err));
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('stripe-checkout error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
