import { askPrimer } from '@/lib/permission-primer';

/** Opens the microphone primer (`6801:6542`) and resolves with the person's choice. */
export const askMicPrimer = () => askPrimer('mic');

/** Thrown when the person chooses "Not now" on the primer, so callers can cancel quietly. */
export class MicPrimerDismissed extends Error {
  constructor() {
    super('Microphone primer dismissed');
    this.name = 'MicPrimerDismissed';
  }
}
