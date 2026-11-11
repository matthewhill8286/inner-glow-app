import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type Native = {
  isSupported(): boolean;
  start(practice: string, phase: string, count: number, endsAtMs: number): Promise<string | null>;
  update(phase: string, count: number, endsAtMs: number): Promise<void>;
  end(): Promise<void>;
};

/** The breathing Live Activity (`6852:8322`). Missing on Android, web and older builds, where every call is a no-op. */
const native = Platform.OS === 'ios' ? requireOptionalNativeModule<Native>('LiveActivity') : null;

export const BreathingActivity = {
  supported: () => !!native?.isSupported(),
  start: (practice: string, phase: string, count: number, endsAt: number) =>
    native ? native.start(practice, phase, count, endsAt).catch(() => null) : Promise.resolve(null),
  update: (phase: string, count: number, endsAt: number) =>
    native ? native.update(phase, count, endsAt).catch(() => undefined) : Promise.resolve(),
  end: () => (native ? native.end().catch(() => undefined) : Promise.resolve()),
};
