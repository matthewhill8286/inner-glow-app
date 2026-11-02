import { createContext, useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenBottomPadding } from '@/lib/screen-layout';

/** Whether the floating tab bar is showing. Set by `app/(tabs)/_layout.tsx`; false elsewhere. */
export const TabBarVisibleContext = createContext(false);

export const useTabBarVisible = () => useContext(TabBarVisibleContext);

/** Bottom space for the current screen: clears the tab bar when it shows, else the home indicator. */
export function useBottomSpace() {
  const visible = useTabBarVisible();
  const insets = useSafeAreaInsets();
  return screenBottomPadding(insets.bottom, visible);
}
