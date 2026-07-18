import { create } from 'zustand';
import { EntitlementStatus, SubscriptionPackage } from '../types/subscription.types';
import { subscriptionApi } from '../api/subscription.api';

interface SubscriptionState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  entitlement: EntitlementStatus | null;
  packages: SubscriptionPackage[];
  error: string | null;
}

interface SubscriptionActions {
  checkEntitlement: (userId: string) => Promise<void>;
  loadPackages: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>((set) => ({
  status: 'idle',
  entitlement: null,
  packages: [],
  error: null,

  checkEntitlement: async (userId) => {
    set({ status: 'loading' });
    try {
      const entitlement = await subscriptionApi.getEntitlementStatus(userId);
      set({ status: 'loaded', entitlement, error: null });
    } catch (e: any) {
      // Fail-closed: default to no premium access on error
      set({
        status: 'error',
        entitlement: { subscriptionStatus: 'free', hasPremiumAccess: false, isInGracePeriod: false },
        error: e.message,
      });
    }
  },

  loadPackages: async () => {
    const packages = await subscriptionApi.getOfferings();
    set({ packages });
  },
}));

// Derived selector
export const hasPremiumAccess = (state: SubscriptionState): boolean =>
  state.entitlement?.hasPremiumAccess ?? false;
