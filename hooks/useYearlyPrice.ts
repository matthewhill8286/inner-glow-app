import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/supabase/supabase';
import configureRevenueCat, { getDefaultOffering, PLAN_TO_PACKAGE } from '@/lib/revenuecat';

/** The localized App Store price of the yearly plan ("€59.99"), or null where it can't load. */
export function useYearlyPrice() {
  const [price, setPrice] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let live = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await configureRevenueCat(session?.user?.id);
      const yearly = (await getDefaultOffering())?.availablePackages.find(
        (p) => p.identifier === PLAN_TO_PACKAGE.yearly,
      );
      if (live && yearly?.product.priceString) setPrice(yearly.product.priceString);
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return price;
}
