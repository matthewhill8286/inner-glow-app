import { LegacyRouteRedirect } from '@/components/LegacyRouteRedirect';

/** Preserve existing deep links; all new navigation uses the feature stack. */
export default function LegacyScreen() {
  return <LegacyRouteRedirect to="/(tabs)/profile/edit" />;
}
