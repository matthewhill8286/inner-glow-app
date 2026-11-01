/**
 * Active sessions (08 §2.8). Supabase records the HTTP user agent of each sign-in; this turns it
 * into a device name. The app's own requests come from CFNetwork/Darwin on iOS and okhttp on Android.
 */
export type DeviceKind = 'phone' | 'tablet' | 'web';
export type DeviceInfo = { kind: DeviceKind; name: string };

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];
const SYSTEMS: [RegExp, string][] = [
  [/Macintosh|Mac OS X/, 'Mac'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

export function deviceFromUserAgent(ua: string | null | undefined): DeviceInfo {
  const s = ua ?? '';
  if (/iPad/.test(s)) return { kind: 'tablet', name: 'iPad' };
  if (/iPhone/.test(s) || (/CFNetwork|Darwin/.test(s) && !/Macintosh/.test(s)))
    return { kind: 'phone', name: 'iPhone' };
  if (/Android|okhttp/i.test(s))
    return {
      kind: /Tablet/.test(s) ? 'tablet' : 'phone',
      name: /Tablet/.test(s) ? 'Android tablet' : 'Android phone',
    };
  const browser = BROWSERS.find(([re]) => re.test(s))?.[1];
  const system = SYSTEMS.find(([re]) => re.test(s))?.[1];
  if (browser) return { kind: 'web', name: system ? `${browser} on ${system}` : browser };
  return { kind: 'web', name: 'Unknown device' };
}
