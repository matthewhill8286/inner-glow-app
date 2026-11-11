/**
 * Permission primers: the microphone (`6801:6542`) and Apple Health (`6801:6587`). Before iOS asks
 * for the first time, the app explains why. `askPrimer` opens the primer and resolves with the
 * person's choice.
 */
export type PrimerKind = 'mic' | 'health';
type Listener = (kind: PrimerKind | null) => void;

let pending: ((allow: boolean) => void) | null = null;
const listeners = new Set<Listener>();

export function askPrimer(kind: PrimerKind): Promise<boolean> {
  pending?.(false);
  return new Promise((resolve) => {
    pending = resolve;
    listeners.forEach((l) => l(kind));
  });
}

export function answerPrimer(allow: boolean) {
  const resolve = pending;
  pending = null;
  listeners.forEach((l) => l(null));
  resolve?.(allow);
}

export function onPrimer(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
