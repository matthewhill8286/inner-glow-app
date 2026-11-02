/**
 * Notification moments (03 §3.3–3.8, §4.6–4.10), kept pure so they are unit tested: the Glow rising
 * scale, the journal constellation, the calm wave and the night curve.
 */

/** Glow rising scale (03 §4.7): whole-five range covering both values, at least 10 points tall. */
export function riseScale(previous: number, current: number, height = 300) {
  let lo = Math.floor(Math.min(previous, current) / 5) * 5;
  let hi = Math.ceil(Math.max(previous, current) / 5) * 5;
  if (hi - lo < 10) hi = lo + 10;
  if (hi === Math.max(previous, current) && hi < 100) hi += 5;
  if (lo < 0) lo = 0;
  const perPoint = height / (hi - lo);
  const y = (v: number) => (hi - v) * perPoint;
  const ticks: { value: number; y: number; major: boolean }[] = [];
  for (let v = hi; v >= lo; v--) ticks.push({ value: v, y: y(v), major: v % 5 === 0 });
  return { lo, hi, y, ticks };
}

/** Constellation grid (03 §4.6): 6 columns, day d at index d − 1, in the 375 frame. */
export function constellationPoint(day: number) {
  const i = day - 1;
  return { x: 77.5 + 44 * (i % 6), y: 236 + 48 * Math.floor(i / 6) };
}

/** Entries needed to beat last month; 0 when this month already did. */
export function toBeatLastMonth(thisMonth: number, lastMonth: number) {
  return Math.max(0, lastMonth + 1 - thisMonth);
}

/** Small seeded random numbers, so a day's wave is the same every time it is drawn. */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Calm wave (03 §4.8), drawn from the day's mood check-ins: unsettled noise up to the settle point
 * whose size follows how tense the first check-in was (mood 1 is the most tense), then a gentle sine.
 * Points are in a `width` × 160 frame with the band at y 36–128.
 */
export function calmWave(seed: string, startMood: number, width: number, settleAt = 0.64) {
  const rand = seeded(seed);
  const mid = 82;
  const amp = 10 + (5 - Math.max(1, Math.min(5, startMood))) * 9; // mood 1 → ±46
  const settleX = width * settleAt;
  const pts: { x: number; y: number }[] = [];
  // The peak marker stays clear of the screen edge.
  const inset = 28;
  let peak = { x: 0, y: mid };
  for (let x = 0; x <= width; x += 5) {
    let y: number;
    if (x < settleX) {
      const fade = 1 - (x / settleX) * 0.6;
      y = mid + (rand() * 2 - 1) * amp * fade;
      if (x >= inset && y < peak.y && x < settleX * 0.5) peak = { x, y };
    } else {
      y = mid + Math.sin(((x - settleX) / 90) * Math.PI * 2) * 12;
    }
    pts.push({ x, y: Math.max(36, Math.min(128, y)) });
  }
  if (peak.x === 0) peak = pts.find((p) => p.x >= inset) ?? pts[0];
  const calm = pts.reduce((best, p) => (Math.abs(p.x - width * 0.9) < Math.abs(best.x - width * 0.9) ? p : best), pts[0]);
  return { points: pts, peak, calm };
}

/** The decorative night curve (03 §4.10) for nights without stages: 16 depth samples, 0 = top. */
export const NIGHT_SAMPLES = [102, 57.4, 12.8, 38.3, 76.5, 19.1, 0, 51, 89.3, 31.9, 6.4, 63.8, 82.9, 44.6, 70.1, 102];

/** Smooth path through samples with flat tangents (control points at 1/3 and 2/3 of each step). */
export function smoothPath(samples: number[], width: number, top = 22.5, height = 127.5) {
  const step = width / (samples.length - 1);
  const sy = height / 102;
  const p = samples.map((s, i) => ({ x: i * step, y: top + s * sy }));
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1];
    const b = p[i];
    d += ` C${(a.x + step / 3).toFixed(1)},${a.y.toFixed(1)} ${(a.x + (2 * step) / 3).toFixed(1)},${b.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }
  return { line: d, area: `${d} L${width.toFixed(1)},${top + height} L0,${top + height} Z` };
}

/** The next time at `hour:minute`, today if it is still ahead, otherwise tomorrow. */
export function nextAt(hour: number, minute: number, now = new Date()) {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
  return t;
}
