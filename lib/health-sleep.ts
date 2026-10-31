import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepEntry } from './types';

/**
 * Sleep import from Apple Health (iOS) and Health Connect (Android).
 *
 * The pure part (`groupNights`, `toSleepEntryInputs`, `dedupeAgainst`) turns raw
 * sleep samples into the app's sleep entry shape and drops nights that are
 * already saved. The native part reads the samples and is loaded lazily so web
 * and the unit tests never touch a native module.
 */

export type HealthSleepKind = 'inBed' | 'asleep' | 'core' | 'deep' | 'rem' | 'awake' | 'outOfBed';

export type HealthSleepSample = {
  start: string | Date;
  end: string | Date;
  kind: HealthSleepKind;
};

export type HealthNight = {
  startMs: number;
  endMs: number;
  /** Hours asleep. Falls back to the in-bed span when no asleep samples exist. */
  asleepHours: number;
  /** Count of awake periods between falling asleep and waking. Undefined when the source has no awake data. */
  awakenings?: number;
};

export type SleepEntryInput = Pick<SleepEntry, 'startISO' | 'endISO' | 'duration' | 'awakenings'>;

export type HealthProvider = 'apple_health' | 'health_connect';

/** Samples further apart than this belong to different nights. */
const NIGHT_GAP_MS = 3 * 60 * 60 * 1000;
/** Ignore naps and fragments shorter than this. */
const MIN_NIGHT_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const IMPORT_DAYS = 30;

type Interval = [number, number];

const ASLEEP_KINDS: HealthSleepKind[] = ['asleep', 'core', 'deep', 'rem'];

function toMs(value: string | Date) {
  return typeof value === 'string' ? Date.parse(value) : value.getTime();
}

/** Union of intervals, so overlapping samples from a watch and a phone are counted once. */
function mergeIntervals(intervals: Interval[], joinGapMs = 0): Interval[] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out: Interval[] = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1] + joinGapMs) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

const totalMs = (intervals: Interval[]) => intervals.reduce((sum, [s, e]) => sum + (e - s), 0);

/** Groups raw samples into nights: one bedtime, one wake time, hours asleep and awakenings. */
export function groupNights(samples: HealthSleepSample[]): HealthNight[] {
  const parsed = samples
    .map((s) => ({ start: toMs(s.start), end: toMs(s.end), kind: s.kind }))
    .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start && s.kind !== 'outOfBed')
    .sort((a, b) => a.start - b.start);

  const clusters: (typeof parsed)[] = [];
  let clusterEnd = -Infinity;
  for (const sample of parsed) {
    if (sample.start - clusterEnd > NIGHT_GAP_MS) clusters.push([]);
    clusters[clusters.length - 1].push(sample);
    clusterEnd = Math.max(clusterEnd, sample.end);
  }

  const nights: HealthNight[] = [];
  for (const cluster of clusters) {
    const startMs = Math.min(...cluster.map((s) => s.start));
    const endMs = Math.max(...cluster.map((s) => s.end));
    if (endMs - startMs < MIN_NIGHT_MS) continue;

    const asleep = mergeIntervals(cluster.filter((s) => ASLEEP_KINDS.includes(s.kind)).map((s) => [s.start, s.end] as Interval));
    const asleepMs = asleep.length ? totalMs(asleep) : endMs - startMs;

    let awakenings: number | undefined;
    const awake = cluster.filter((s) => s.kind === 'awake');
    if (awake.length && asleep.length) {
      const firstAsleep = asleep[0][0];
      const lastAsleep = asleep[asleep.length - 1][1];
      awakenings = mergeIntervals(
        awake.filter((s) => s.start >= firstAsleep && s.end <= lastAsleep).map((s) => [s.start, s.end] as Interval),
      ).length;
    } else if (asleep.length > 1) {
      // Sources without awake samples still leave gaps between asleep blocks.
      awakenings = mergeIntervals(asleep, 5 * 60 * 1000).length - 1;
    }

    nights.push({ startMs, endMs, asleepHours: asleepMs / 3_600_000, awakenings });
  }
  return nights;
}

/** Maps nights to the shape `useSleep().addSleepEntry` and the `sleep` table take. */
export function toSleepEntryInputs(nights: HealthNight[]): SleepEntryInput[] {
  return nights.map((n) => ({
    startISO: new Date(n.startMs).toISOString(),
    endISO: new Date(n.endMs).toISOString(),
    duration: Math.round(n.asleepHours * 100) / 100,
    awakenings: n.awakenings,
  }));
}

/**
 * Two entries are the same night when their time spans overlap by at least half
 * of the shorter one. This catches a manual log of the same night with rounded
 * times as well as a previous import.
 */
export function isSameNight(a: Pick<SleepEntry, 'startISO' | 'endISO'>, b: Pick<SleepEntry, 'startISO' | 'endISO'>) {
  const as = Date.parse(a.startISO), ae = Date.parse(a.endISO);
  const bs = Date.parse(b.startISO), be = Date.parse(b.endISO);
  if (![as, ae, bs, be].every(Number.isFinite)) return false;
  const overlap = Math.min(ae, be) - Math.max(as, bs);
  const shorter = Math.min(ae - as, be - bs);
  return shorter > 0 && overlap >= shorter / 2;
}

/** Drops incoming nights that match a saved entry or an earlier incoming night. */
export function dedupeAgainst<T extends Pick<SleepEntry, 'startISO' | 'endISO'>>(
  incoming: T[],
  existing: Pick<SleepEntry, 'startISO' | 'endISO'>[],
): T[] {
  const kept: T[] = [];
  for (const entry of incoming) {
    if (existing.some((e) => isSameNight(e, entry))) continue;
    if (kept.some((e) => isSameNight(e, entry))) continue;
    kept.push(entry);
  }
  return kept;
}

/** The full pure pipeline: samples in, new entries to save out, limited to the last `days` nights. */
export function planImport(
  samples: HealthSleepSample[],
  existing: Pick<SleepEntry, 'startISO' | 'endISO'>[],
  now = Date.now(),
  days = IMPORT_DAYS,
): SleepEntryInput[] {
  const since = now - days * DAY_MS;
  const nights = groupNights(samples).filter((n) => n.endMs > since && n.endMs <= now);
  return dedupeAgainst(toSleepEntryInputs(nights), existing);
}

/* ── Apple Health value → kind ─────────────────────── */

/** HKCategoryValueSleepAnalysis raw values. */
export function kindFromHealthKit(value: number): HealthSleepKind {
  switch (value) {
    case 0:
      return 'inBed';
    case 2:
      return 'awake';
    case 3:
      return 'core';
    case 4:
      return 'deep';
    case 5:
      return 'rem';
    default:
      return 'asleep';
  }
}

/** Health Connect SleepStageType raw values. Unknown stages count as asleep. */
export function kindFromHealthConnect(stage: number): HealthSleepKind {
  switch (stage) {
    case 1:
      return 'awake';
    case 3:
      return 'outOfBed';
    case 4:
      return 'core';
    case 5:
      return 'deep';
    case 6:
      return 'rem';
    default:
      return 'asleep';
  }
}

/* ── Native access ─────────────────────────────────── */

export function healthProvider(): HealthProvider | null {
  if (Platform.OS === 'ios') return 'apple_health';
  if (Platform.OS === 'android') return 'health_connect';
  return null;
}

const SLEEP_IDENTIFIER = 'HKCategoryTypeIdentifierSleepAnalysis';
const HC_SLEEP_PERMISSION = { accessType: 'read', recordType: 'SleepSession' } as const;

function healthKit(): typeof import('@kingstinct/react-native-healthkit') {
  // Lazy so web and the other platform never load this native module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@kingstinct/react-native-healthkit');
}

function healthConnect(): typeof import('react-native-health-connect') {
  // Lazy so web and the other platform never load this native module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-health-connect');
}

/** Whether this device can provide sleep data at all (Health app present, Health Connect installed). */
export async function isHealthAvailable(): Promise<boolean> {
  try {
    const provider = healthProvider();
    if (provider === 'apple_health') return await healthKit().isHealthDataAvailableAsync();
    if (provider === 'health_connect') {
      const hc = healthConnect();
      return (await hc.getSdkStatus()) === hc.SdkAvailabilityStatus.SDK_AVAILABLE;
    }
  } catch (e) {
    console.warn('[health-sleep] availability check failed', e);
  }
  return false;
}

/**
 * Shows the system permission sheet. Apple Health never says whether read access
 * was granted, so on iOS `true` only means the sheet was handled; an empty read
 * afterwards is the only sign the user said no.
 */
export async function requestSleepAccess(): Promise<boolean> {
  const provider = healthProvider();
  if (provider === 'apple_health') {
    return healthKit().requestAuthorization({ toRead: [SLEEP_IDENTIFIER] });
  }
  if (provider === 'health_connect') {
    const hc = healthConnect();
    await hc.initialize();
    const granted = await hc.requestPermission([HC_SLEEP_PERMISSION]);
    return granted.some((p) => 'recordType' in p && p.recordType === 'SleepSession' && p.accessType === 'read');
  }
  return false;
}

/** Reads raw sleep samples from the platform store since `sinceMs`. */
export async function readSleepSamples(sinceMs: number, nowMs = Date.now()): Promise<HealthSleepSample[]> {
  const provider = healthProvider();
  if (provider === 'apple_health') {
    const samples = await healthKit().queryCategorySamples(SLEEP_IDENTIFIER, {
      limit: 0,
      ascending: true,
      filter: { date: { startDate: new Date(sinceMs), endDate: new Date(nowMs) } },
    });
    return samples.map((s) => ({ start: s.startDate, end: s.endDate, kind: kindFromHealthKit(Number(s.value)) }));
  }
  if (provider === 'health_connect') {
    const hc = healthConnect();
    await hc.initialize();
    const out: HealthSleepSample[] = [];
    let pageToken: string | undefined;
    do {
      const page = await hc.readRecords('SleepSession', {
        timeRangeFilter: { operator: 'between', startTime: new Date(sinceMs).toISOString(), endTime: new Date(nowMs).toISOString() },
        pageToken,
      });
      for (const record of page.records) {
        if (record.stages?.length) {
          for (const stage of record.stages) out.push({ start: stage.startTime, end: stage.endTime, kind: kindFromHealthConnect(stage.stage) });
        } else {
          out.push({ start: record.startTime, end: record.endTime, kind: 'asleep' });
        }
      }
      pageToken = page.pageToken || undefined;
    } while (pageToken);
    return out;
  }
  return [];
}

/* ── Connection state (per device) ─────────────────── */

export type HealthConnection = { connected: boolean; lastSyncISO: string | null };

const CONNECTION_KEY = 'health-sleep-connection';
const DISCONNECTED: HealthConnection = { connected: false, lastSyncISO: null };

export async function loadHealthConnection(): Promise<HealthConnection> {
  try {
    const raw = await AsyncStorage.getItem(CONNECTION_KEY);
    return raw ? { ...DISCONNECTED, ...JSON.parse(raw) } : DISCONNECTED;
  } catch {
    return DISCONNECTED;
  }
}

export async function saveHealthConnection(next: HealthConnection) {
  await AsyncStorage.setItem(CONNECTION_KEY, JSON.stringify(next));
}
