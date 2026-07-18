import { supabase } from '@/core/supabase/client';
import { EntitlementStatus } from '../types/subscription.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';
import { AppConstants } from '@/core/constants/app.constants';

export const subscriptionApi = {
  /**
   * Server-authoritative entitlement check via SECURITY DEFINER RPC.
   * The client NEVER trusts local state for premium gating.
   */
  async getEntitlementStatus(userId: string): Promise<EntitlementStatus> {
    const { data, error } = await (supabase as any).rpc(
      SupabaseConstants.rpcGetEntitlementStatus,
      { p_user_id: userId }
    );
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      subscriptionStatus: (row?.subscription_status ?? 'free') as any,
      hasPremiumAccess: row?.has_premium_access ?? false,
      isInGracePeriod: row?.is_in_grace_period ?? false,
      gracePeriodEndsAt: row?.grace_period_ends_at,
      entitlementExpiresAt: row?.entitlement_expires_at,
    };
  },

  // TODO(revenuecat): Replace stub with real RevenueCat SDK calls
  async getOfferings(): Promise<import('../types/subscription.types').SubscriptionPackage[]> {
    // TODO(revenuecat): const offerings = await Purchases.getOfferings();
    // Return stub packages for UI development
    return [
      {
        id: 'monthly',
        title: 'Monthly',
        period: 'monthly',
        priceDisplay: '৳99/month',
        priceAmount: AppConstants.bkashAmountMonthly,
      },
      {
        id: 'annual',
        title: 'Annual',
        period: 'annual',
        priceDisplay: '৳799/year',
        priceAmount: AppConstants.bkashAmountAnnual,
      },
    ];
  },

  async purchasePackage(_packageId: string): Promise<void> {
    // TODO(revenuecat): await Purchases.purchasePackage(package);
    throw new Error('RevenueCat SDK not yet integrated. Use bKash payment instead.');
  },
};
