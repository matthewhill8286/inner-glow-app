export const DIAGNOSTIC_EVENTS = [
  'app_crash',
  'service_failure',
  'billing_refresh',
  'billing_restore',
  'billing_purchase',
] as const;
export type DiagnosticEvent = (typeof DIAGNOSTIC_EVENTS)[number];
export const DIAGNOSTIC_CODES = [
  'UNEXPECTED',
  'NETWORK',
  'AUTH_REQUIRED',
  'ACCESS_REQUIRED',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'BILLING_UNAVAILABLE',
] as const;
export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[number];
export function serviceCode(status?: number): DiagnosticCode {
  if (!status) return 'NETWORK';
  return (
    (
      {
        401: 'AUTH_REQUIRED',
        403: 'ACCESS_REQUIRED',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        429: 'RATE_LIMITED',
      } as Record<number, DiagnosticCode>
    )[status] ?? 'SERVICE_UNAVAILABLE'
  );
}
export function safeDiagnostic(input: unknown) {
  const value = input as Record<string, unknown> | null;
  if (
    !value ||
    !DIAGNOSTIC_EVENTS.includes(value.event as DiagnosticEvent) ||
    !DIAGNOSTIC_CODES.includes(value.code as DiagnosticCode)
  )
    return null;
  if (typeof value.reference !== 'string' || !/^[a-z0-9-]{8,64}$/.test(value.reference))
    return null;
  return {
    event: value.event,
    code: value.code,
    reference: value.reference,
    platform: ['ios', 'android', 'web'].includes(String(value.platform))
      ? value.platform
      : 'unknown',
    release:
      typeof value.release === 'string' && /^[0-9.() -]{1,40}$/.test(value.release)
        ? value.release
        : 'unknown',
  };
}
