/**
 * Microphone primer (`6801:6542`). Before iOS asks for the microphone the first time, the app
 * explains why. `askMicPrimer` opens the primer and resolves with the person's choice.
 */
type Listener = (open: boolean) => void;

let pending: ((allow: boolean) => void) | null = null;
const listeners = new Set<Listener>();

export function askMicPrimer(): Promise<boolean> {
  pending?.(false);
  return new Promise((resolve) => {
    pending = resolve;
    listeners.forEach((l) => l(true));
  });
}

export function answerMicPrimer(allow: boolean) {
  const resolve = pending;
  pending = null;
  listeners.forEach((l) => l(false));
  resolve?.(allow);
}

export function onMicPrimer(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Thrown when the person chooses "Not now" on the primer, so callers can cancel quietly. */
export class MicPrimerDismissed extends Error {
  constructor() {
    super('Microphone primer dismissed');
    this.name = 'MicPrimerDismissed';
  }
}
