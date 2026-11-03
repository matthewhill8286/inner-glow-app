/**
 * Rules for the sleep flow (06 §S2–S7, §4.2, §4.5), kept pure so they are unit tested.
 * Times of day are minutes after midnight, 0–1439.
 */

const DAY_MIN = 1440;

/** Shortest and longest sleep window the dial allows (06 §4.2, proposed). */
export const MIN_WINDOW = 180;
export const MAX_WINDOW = 720;

/** "Stop sound after" choices on Wind down (06 §S3); null is Never. */
export const STOP_AFTER_CHOICES: (number | null)[] = [15, 30, 45, 60, null];

/** Snooze length on Wake up (06 §S5). */
export const SNOOZE_MINUTES = 9;

export const minuteOfDay = (hour: number, minute: number) => (((hour * 60 + minute) % DAY_MIN) + DAY_MIN) % DAY_MIN;
export const hourMinute = (m: number) => ({ hour: Math.floor(m / 60) % 24, minute: m % 60 });

/** Minutes from bedtime to wake time, wrapping past midnight. */
export function windowMinutes(bed: number, wake: number) {
  const w = (((wake - bed) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return w === 0 ? DAY_MIN : w;
}

/** Dial angle in degrees: 00:00 at 12 o'clock, clockwise, 15° per hour. */
export const dialAngle = (minutes: number) => (minutes % DAY_MIN) * 0.25;

/** Point on a circle of radius `r` around (cx, cy) for a time of day. */
export function dialPoint(minutes: number, r: number, cx: number, cy: number) {
  const a = (dialAngle(minutes) * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/** Time of day under a touch at (dx, dy) from the dial centre, snapped to `step` minutes. */
export function minutesAt(dx: number, dy: number, step = 5) {
  const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  const m = Math.round(deg / 0.25 / step) * step;
  return m % DAY_MIN;
}

/** True when a bed/wake pair stays inside the allowed window. */
export const windowAllowed = (bed: number, wake: number) => {
  const w = windowMinutes(bed, wake);
  return w >= MIN_WINDOW && w <= MAX_WINDOW;
};

/** SVG path for a ring segment between two times (clockwise from `from` to `to`). */
export function ringSegment(from: number, to: number, rOuter: number, rInner: number, cx: number, cy: number) {
  const sweep = windowMinutes(from, to);
  const large = sweep * 0.25 > 180 ? 1 : 0;
  const o0 = dialPoint(from, rOuter, cx, cy);
  const o1 = dialPoint(from + sweep, rOuter, cx, cy);
  const i1 = dialPoint(from + sweep, rInner, cx, cy);
  const i0 = dialPoint(from, rInner, cx, cy);
  const f = (n: number) => n.toFixed(2);
  return `M${f(o0.x)},${f(o0.y)} A${rOuter},${rOuter} 0 ${large} 1 ${f(o1.x)},${f(o1.y)} L${f(i1.x)},${f(i1.y)} A${rInner},${rInner} 0 ${large} 0 ${f(i0.x)},${f(i0.y)} Z`;
}

/**
 * The window drawn as short segments so each can take its colour along the sweep (06 §4.2: there
 * is no conic gradient in react-native-svg). `t` runs 0 at bedtime to 1 at wake.
 */
export function windowSegments(bed: number, wake: number, stepMinutes = 8) {
  const total = windowMinutes(bed, wake);
  const out: { from: number; to: number; t: number }[] = [];
  for (let at = 0; at < total; at += stepMinutes) {
    const len = Math.min(stepMinutes + 0.5, total - at);
    out.push({ from: bed + at, to: bed + at + len, t: (at + len / 2) / total });
  }
  return out;
}

/** Blend two #RRGGBB colours. */
export function mixColour(a: string, b: string, t: number) {
  const p = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const ch = (i: number) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

/** "8h 00m". */
export function formatWindow(minutes: number) {
  const m = Math.round(minutes);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/** Share of the sleep goal, as a whole percentage. The goal is the schedule's window (06 §6 item 8). */
export function goalPercent(sleptMinutes: number, goalMinutes: number) {
  if (goalMinutes <= 0) return 0;
  return Math.round((sleptMinutes / goalMinutes) * 100);
}

export type StageKind = 'awake' | 'rem' | 'light' | 'deep';
const LEVEL: Record<StageKind, number> = { awake: 24, rem: 48, light: 72, deep: 96 };

/**
 * Hypnogram (Figma `6716:4411`): one point at the middle of each stage, at that stage's depth,
 * joined by a smooth curve with flat tangents, so the night reads as gentle waves rather than
 * steps. Returns the line path and the area path (closed down to `height`).
 */
export function hypnogram(
  stages: { stage: StageKind; startISO: string; endISO: string }[],
  width: number,
  height = 112,
) {
  if (!stages.length) return null;
  const start = Date.parse(stages[0].startISO);
  const end = Date.parse(stages[stages.length - 1].endISO);
  if (!(end > start)) return null;
  const x = (ms: number) => ((ms - start) / (end - start)) * width;
  const f = (n: number) => n.toFixed(2);
  const points = [
    { x: 0, y: LEVEL[stages[0].stage] },
    ...stages.map((st) => ({ x: x((Date.parse(st.startISO) + Date.parse(st.endISO)) / 2), y: LEVEL[st.stage] })),
    { x: width, y: LEVEL[stages[stages.length - 1].stage] },
  ];
  let d = `M0,${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mid = (a.x + b.x) / 2;
    d += ` C${f(mid)},${a.y} ${f(mid)},${b.y} ${f(b.x)},${b.y}`;
  }
  d += ` L${f(width)},${points[points.length - 1].y}`;
  return { line: d, area: `${d} L${f(width)},${height} L0,${height} Z`, startMs: start, endMs: end };
}

/**
 * Axis labels for a night: bedtime, two whole hours spaced through the night, and wake time,
 * each placed by its real time (06 §4.5).
 */
export function nightAxis(startMs: number, endMs: number, width: number) {
  const span = endMs - startMs;
  if (!(span > 0)) return [];
  const at = (ms: number) => ({ ms, x: ((ms - startMs) / span) * width });
  const hours: number[] = [];
  const first = new Date(startMs);
  first.setMinutes(0, 0, 0);
  for (let t = first.getTime() + 3_600_000; t < endMs - 1_800_000; t += 3_600_000) {
    if (t > startMs + 1_800_000) hours.push(t);
  }
  const middle = hours.length <= 2 ? hours : [hours[Math.floor(hours.length / 3)], hours[Math.floor((2 * hours.length) / 3)]];
  return [at(startMs), ...middle.map(at), at(endMs)];
}

/** Minutes in each stage, and their total. */
export function stageMinutes(stages: { stage: StageKind; startISO: string; endISO: string }[]) {
  const out: Record<StageKind, number> = { awake: 0, rem: 0, light: 0, deep: 0 };
  for (const s of stages) {
    const m = (Date.parse(s.endISO) - Date.parse(s.startISO)) / 60000;
    if (Number.isFinite(m) && m > 0) out[s.stage] += m;
  }
  return { ...out, asleep: out.rem + out.light + out.deep };
}

/** Swipe to wake (06 §S4): the knob completes once it passes 80 % of its travel. */
export const swipeComplete = (offset: number, travel: number) => travel > 0 && offset >= travel * 0.8;
