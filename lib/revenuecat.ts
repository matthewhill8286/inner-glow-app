import { PRODUCT_IDS, productMatchesPlan } from '@/lib/purchase-products';
/**
 * RevenueCat integration for Apple In-App Purchase (and Google Play Billing).
 *
 * Why this file exists
 * --------------------
 * Apple App Review Guideline 3.1.1 requires that any digital content sold inside
 * an iOS app uses Apple's In-App Purchase. Our previous flow opened a Stripe
 * Checkout URL in a web browser, which Apple rejected.
 *
 * RevenueCat is a thin wrapper on top of StoreKit / Google Play Billing that
 * handles receipt validation, entitlements, restore-purchases, and webhooks.
 *
 * On iOS  → mandatory (Apple IAP)
 * On Android → optional, but using it keeps the codebase symmetrical
 * On Web   → not supported; the app continues to use Stripe Checkout
 *
 * Configure the products + entitlement in the RevenueCat dashboard:
 *   - Entitlement key:    "premium"
 *   - Offering identifier: "default"
 *   - Packages:           "$rc_monthly", "$rc_lifetime"
 * and link them to the App Store Connect / Play Console SKUs.
 */
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';

export const PREMIUM_ENTITLEMENT_ID = 'premium';
export const DEFAULT_OFFERING_ID = 'default';

/** Map our internal plan id ↔ RevenueCat package identifier. */
export const PLAN_TO_PACKAGE: Record<'monthly' | 'lifetime', string> = {
  monthly: '$rc_monthly',
  lifetime: '$rc_lifetime',
};

let configured = false;
let currentUserId: string | null = null;
let identityQueue: Promise<void> = Promise.resolve();

/** Serialize identity changes so purchases cannot run for the previous account. */
export default function configureRevenueCat(appUserId?: string | null): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.resolve();
  const requestedUser = appUserId ?? null;
  const task = identityQueue.then(async () => {
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    if (!apiKey || !apiKey.startsWith('appl_') || /xxx|placeholder/i.test(apiKey)) {
      throw new Error('Apple purchases are unavailable. Please try again later.');
    }
    if (!configured) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey, appUserID: requestedUser ?? undefined });
      configured = true;
      currentUserId = requestedUser;
    } else if (currentUserId !== requestedUser) {
      if (requestedUser) await Purchases.logIn(requestedUser);
      else if (!(await Purchases.isAnonymous())) await Purchases.logOut();
      currentUserId = requestedUser;
    }
  });
  identityQueue = task.catch(() => {});
  return task;
}

async function requireReady(): Promise<void> {
  await identityQueue;
  if (!configured || Platform.OS !== 'ios') throw new Error('Apple purchases are unavailable.');
}

/** Fetch the current "default" offering and its packages. */
export async function getDefaultOffering(): Promise<PurchasesOffering | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    await requireReady();
    const offerings = await Purchases.getOfferings();
    return offerings.all[DEFAULT_OFFERING_ID] ?? null;
  } catch (err) {
    console.warn('[RevenueCat] getOfferings failed', err);
    return null;
  }
}

/**
 * Purchase a package by our internal plan id ('monthly' | 'lifetime').
 * Returns the resulting CustomerInfo on success, or null if the user
 * cancelled. Throws on real errors.
 */
export async function purchasePlan(plan: 'monthly' | 'lifetime'): Promise<CustomerInfo | null> {
  await requireReady();

  // Check the current receipt before opening StoreKit, including direct purchase callers.
  await Purchases.invalidateCustomerInfoCache();
  const existing = await Purchases.getCustomerInfo();
  const entitlement = existing.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (
    entitlement?.isActive &&
    (entitlement.productIdentifier === PRODUCT_IDS.lifetime ||
      entitlement.productIdentifier === PRODUCT_IDS[plan])
  )
    return existing;

  const offering = await getDefaultOffering();
  if (!offering) {
    throw new Error('No RevenueCat offering configured. Check the dashboard offering "default".');
  }

  const packageId = PLAN_TO_PACKAGE[plan];
  const pkg: PurchasesPackage | undefined = offering.availablePackages.find(
    (p) => p.identifier === packageId,
  );

  if (!pkg || !productMatchesPlan(plan, pkg.product)) {
    throw new Error(
      `RevenueCat package "${packageId}" not found in offering "${offering.identifier}". ` +
        'Make sure the App Store Connect product is attached.',
    );
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (e?.userCancelled || e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return null;
    }
    if (e?.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
      // Apple may know about a purchase before the local customer-info cache does.
      const restored = await Purchases.restorePurchases();
      if (hasPremiumEntitlement(restored)) return restored;
    }
    throw e;
  }
}

/** Restore previous purchases (REQUIRED by Apple guideline 3.1.1). */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    await requireReady();
    return await Purchases.restorePurchases();
  } catch (err) {
    console.warn('[RevenueCat] restore failed', err);
    throw err;
  }
}

/** True when the user currently owns the "premium" entitlement. */
export function hasPremiumEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return !!info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
}

/** Convenience: pull the current customer info from RevenueCat. */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    await requireReady();
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn('[RevenueCat] getCustomerInfo failed', err);
    return null;
  }
}

/** Events only trigger a fresh identity-checked load; they never grant access directly. */
export function subscribeToPurchaseUpdates(onChange: () => void): () => void {
  if (Platform.OS !== 'ios') return () => {};
  const listener = () => onChange();
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
