import { recordDiagnostic } from '@/lib/diagnostics';
import { serviceCode, type DiagnosticCode } from './diagnostic-events';
export class ServiceError extends Error {
  readonly code: DiagnosticCode;
  readonly reference: string;
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = serviceCode(status);
    this.reference = recordDiagnostic('service_failure', this.code);
  }
}

/** Supabase's HTTP error wraps the useful response body in context. */
export async function functionError(error: unknown): Promise<ServiceError> {
  const wrapped = error as { message?: string; context?: Response } | null;
  const response = wrapped?.context;
  let message = wrapped?.message || 'The service is unavailable. Please try again.';
  if (response && typeof response.clone === 'function') {
    try {
      const body = await response.clone().json();
      if (typeof body?.error === 'string') message = body.error;
      else if (typeof body?.message === 'string') message = body.message;
    } catch {
      /* Preserve the network or HTTP error when the body is not JSON. */
    }
  }
  return new ServiceError(message, response?.status);
}

/** A request that never reached the server: no connection, or the connection dropped. */
export function isOfflineError(error: unknown): boolean {
  if (error instanceof ServiceError) return error.code === 'NETWORK';
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  return /network request failed|failed to fetch|FunctionsFetchError|internet connection appears to be offline/i.test(
    message,
  );
}
