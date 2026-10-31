import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
import { legacyRouteParams } from '@/lib/legacy-routes';

/** Old URLs replace themselves with the canonical screen, preserving safe query values. */
export function LegacyRouteRedirect({ to }: { to: string }) {
  const params = legacyRouteParams(useLocalSearchParams());
  return <Redirect href={{ pathname: to, params } as Href} />;
}
