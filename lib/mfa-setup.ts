import type { SupabaseClient } from '@supabase/supabase-js';

type Mfa = SupabaseClient['auth']['mfa'];
/** Share setup across overlapping mounts; never cache an enrollment after it finishes. */
const pending = new Map<string, Promise<SetupResult>>();
type SetupResult =
  | { enabled: true; id: string }
  | { enabled: false; id: string; qr: string; secret: string };

export function setupTotp(userId: string, mfa: Mfa): Promise<SetupResult> {
  const existing = pending.get(userId);
  if (existing) return existing;
  const operation = (async (): Promise<SetupResult> => {
    const { data, error } = await mfa.listFactors();
    if (error) throw error;
    const verified = data.totp.find((factor) => factor.status === 'verified');
    if (verified) return { enabled: true, id: verified.id };
    for (const factor of data.totp) {
      const { error: cleanupError } = await mfa.unenroll({ factorId: factor.id });
      if (cleanupError) throw cleanupError;
    }
    const { data: enrollment, error: enrollmentError } = await mfa.enroll({
      factorType: 'totp',
      friendlyName: 'InnerGlow Authenticator',
    });
    if (enrollmentError) throw enrollmentError;
    return {
      enabled: false,
      id: enrollment.id,
      qr: totpQrXml(enrollment.totp.qr_code),
      secret: enrollment.totp.secret,
    };
  })();
  pending.set(userId, operation);
  void operation
    .finally(() => {
      if (pending.get(userId) === operation) pending.delete(userId);
    })
    .catch(() => {});
  return operation;
}

/** Supabase prefixes raw SVG with a data URI; SvgXml needs the XML itself. */
export function totpQrXml(qr: string): string {
  const prefix = 'data:image/svg+xml;utf-8,';
  if (qr.startsWith(prefix)) return qr.slice(prefix.length);
  if (qr.startsWith('data:image/svg+xml,'))
    return decodeURIComponent(qr.split(',').slice(1).join(','));
  return qr;
}
