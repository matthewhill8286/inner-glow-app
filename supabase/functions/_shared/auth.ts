import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
import { subscriberState } from './revenuecat.ts';

function hasAccess(
  row: {
    plan: string;
    status: string;
    current_period_end?: string | null;
    trial_end?: string | null;
  } | null,
) {
  if (!row || !['active', 'canceling'].includes(row.status)) return false;
  if (row.plan === 'lifetime') return row.status === 'active';
  const expiry = row.current_period_end || row.trial_end;
  return !!expiry && Date.parse(expiry) > Date.now();
}

export type AIAccess = {
  /** Set when the request must stop here (401 or 503). */
  response?: Response;
  userId: string;
  premium: boolean;
  sb: SupabaseClient;
};

/** Signs the caller in and works out whether they have a trial or Premium. Free users get `premium: false`. */
export async function aiAccess(req: Request, headers: Record<string, string>): Promise<AIAccess> {
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const stop = (response: Response) => ({ response, userId: '', premium: false, sb });
  const token = req.headers.get('authorization')?.replace(/^Bearer /i, '');
  if (!token)
    return stop(Response.json({ error: 'Authentication required' }, { status: 401, headers }));
  try {
    const {
      data: { user },
      error,
    } = await sb.auth.getUser(token);
    if (error || !user)
      return stop(Response.json({ error: 'Authentication required' }, { status: 401, headers }));
    const { data: subscription, error: dbError } = await sb
      .from('subscriptions')
      .select('plan,status,current_period_end,trial_end')
      .eq('user_id', user.id)
      .maybeSingle();
    if (dbError) throw dbError;
    if (hasAccess(subscription)) return { userId: user.id, premium: true, sb };

    // A successful Apple purchase/restore may precede its webhook. Verify it
    // directly with RevenueCat so paid AI access does not wait for delivery.
    const apiKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
    if (apiKey) {
      const fetchedAt = new Date().toISOString();
      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      if (!response.ok) throw new Error(`RevenueCat lookup returned ${response.status}`);
      const { subscriber } = await response.json();
      const state = subscriber ? subscriberState(subscriber) : null;
      if (
        state &&
        hasAccess(state) &&
        (state.environment !== 'SANDBOX' || Deno.env.get('REVENUECAT_ALLOW_SANDBOX') === 'true')
      ) {
        const { error: syncError } = await sb.rpc('sync_revenuecat_subscription', {
          p_user_id: user.id,
          p_state: state,
          p_synced_at: fetchedAt,
        });
        if (syncError) throw syncError;
        return { userId: user.id, premium: true, sb };
      }
    }
    return { userId: user.id, premium: false, sb };
  } catch (err) {
    console.error('[AI access]', err);
    return stop(
      Response.json(
        { error: 'Unable to verify access. Please try again.' },
        { status: 503, headers },
      ),
    );
  }
}

/** For Premium-only AI features: null when the caller may continue, otherwise the response to return. */
export async function authenticationError(req: Request, headers: Record<string, string>) {
  const access = await aiAccess(req, headers);
  if (access.response) return access.response;
  if (access.premium) return null;
  return Response.json(
    { error: 'An active trial or premium purchase is required.' },
    { status: 403, headers },
  );
}
