# 15 — Subscription & Paywall (Agent 15)

> **Agent:** Agent 15  
> **Prerequisite:** Agent 5 (Auth) complete  
> **Flutter Source:** `src/lib/features/subscription/`  
> **Output:** Entitlement checking, SubscriptionGate component, PaywallScreen, RevenueCat TODO stubs

---

## 📋 Tasks

- [ ] Create `EntitlementStatus` TypeScript type
- [ ] Create `subscriptionApi.ts` (Supabase RPC calls)
- [ ] Create `useSubscriptionStore` (Zustand)
- [ ] Build `SubscriptionGate` component (fullscreen + inline modes)
- [ ] Build `PaywallScreen` (hero, feature comparison, plan cards)
- [ ] Add grace period banner
- [ ] Add RevenueCat TODO stubs

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `EntitlementStatus` entity | `EntitlementStatus` interface |
| `SubscriptionNotifier` | `useSubscriptionStore` (Zustand) |
| `SubscriptionGate` widget | `SubscriptionGate` component |
| `paywall_screen.dart` | `app/(app)/paywall.tsx` |
| `hasPremiumAccessProvider` | Derived selector from store |

---

## 🛠️ Implementation

### Step 1: Types

**`src/features/subscription/types/subscription.types.ts`**
```typescript
export type SubscriptionStatus = 'free' | 'active' | 'grace' | 'expired';

export interface EntitlementStatus {
  subscriptionStatus: SubscriptionStatus;
  hasPremiumAccess: boolean;
  isInGracePeriod: boolean;
  gracePeriodEndsAt?: string;
  entitlementExpiresAt?: string;
}

export interface SubscriptionPackage {
  id: string;
  title: string;
  period: 'monthly' | 'annual';
  priceDisplay: string;
  priceAmount: number;
}
```

---

### Step 2: Subscription API

**`src/features/subscription/api/subscription.api.ts`**
```typescript
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
    const { data, error } = await supabase.rpc(
      SupabaseConstants.rpcGetEntitlementStatus,
      { p_user_id: userId }
    );
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      subscriptionStatus: row?.subscription_status ?? 'free',
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
```

---

### Step 3: Subscription Store

**`src/features/subscription/store/subscription.store.ts`**
```typescript
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
```

---

### Step 4: SubscriptionGate Component

**`src/components/SubscriptionGate.tsx`**
```tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore, hasPremiumAccess } from '@/features/subscription/store/subscription.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GlassCard } from './GlassCard';
import { GradientButton } from './GradientButton';
import { Colors } from '@/core/theme/colors';
import { ShimmerLoader } from './ShimmerLoader';

interface SubscriptionGateProps {
  featureName: string;
  children: React.ReactNode;
  inline?: boolean; // true = inline lock card; false = fullscreen takeover
}

export function SubscriptionGate({ featureName, children, inline = false }: SubscriptionGateProps) {
  const { user } = useAuthStore();
  const { status, entitlement, checkEntitlement } = useSubscriptionStore();
  const router = useRouter();
  const isPremium = hasPremiumAccess({ status, entitlement, packages: [], error: null });

  useEffect(() => {
    if (user?.id && status === 'idle') checkEntitlement(user.id);
  }, [user?.id]);

  // Loading state — fail closed (show shimmer, not content)
  if (status === 'loading' || status === 'idle') {
    return inline ? <ShimmerLoader height={80} /> : (
      <View style={styles.fullscreen}>
        <ShimmerLoader height={200} style={{ marginHorizontal: 24 }} />
      </View>
    );
  }

  // Grace period banner (show above content but still allow access)
  const graceBanner = entitlement?.isInGracePeriod ? (
    <View style={styles.graceBanner}>
      <Text style={styles.graceText}>
        ⚠️ Payment issue detected. Access continues until {
          entitlement.gracePeriodEndsAt
            ? new Date(entitlement.gracePeriodEndsAt).toLocaleDateString()
            : 'grace period ends'
        }.
      </Text>
    </View>
  ) : null;

  if (isPremium) {
    return (
      <>
        {graceBanner}
        {children}
      </>
    );
  }

  // Premium content locked
  if (inline) {
    return (
      <GlassCard style={styles.inlineLock}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>{featureName}</Text>
        <Text style={styles.lockSubtitle}>Premium feature</Text>
        <TouchableOpacity onPress={() => router.push('/paywall')} style={styles.unlockBtn}>
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>
      </GlassCard>
    );
  }

  return (
    <View style={styles.fullscreen}>
      <Text style={styles.fullLockIcon}>🔒</Text>
      <Text style={styles.fullLockTitle}>{featureName}</Text>
      <Text style={styles.fullLockSubtitle}>This feature requires a Premium subscription.</Text>
      <GradientButton
        label="View Plans"
        onPress={() => router.push('/paywall')}
        style={{ marginTop: 24, marginHorizontal: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },
  graceBanner: { backgroundColor: 'rgba(255,193,7,0.15)', padding: 12, borderBottomWidth: 1, borderColor: 'rgba(255,193,7,0.3)' },
  graceText: { color: Colors.warning, fontSize: 13, textAlign: 'center' },
  inlineLock: { alignItems: 'center', padding: 20 },
  lockIcon: { fontSize: 24, marginBottom: 8 },
  lockTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  lockSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  unlockBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  unlockText: { color: Colors.white, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  fullLockIcon: { fontSize: 56, marginBottom: 16 },
  fullLockTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, textAlign: 'center' },
  fullLockSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
```

---

### Step 5: Paywall Screen

**`app/(app)/paywall.tsx`**
```tsx
// Full paywall screen with:
// 1. Hero section with 🚀 icon and "Unlock Your Potential" heading
// 2. Feature comparison table: Free vs Premium
//    - Free: Daily Quizzes ✓, Public Leaderboard ✓, AI Hints ✗, Live Exam ✗
//    - Premium: All of the above ✓
// 3. Plan cards (Monthly ৳99 | Annual ৳799 — "BEST VALUE" badge)
// 4. "Pay with bKash" button → navigate to /bkash-payment
// 5. "Restore Purchases" button (TODO revenuecat stub)

// Usage of SubscriptionGate in app router:
// In app/(app)/exam/live/[examId].tsx:
//   <SubscriptionGate featureName="Live Exam">
//     <LiveExamScreen />
//   </SubscriptionGate>
```

---

### Step 6: Protect Premium Routes

Wrap premium screens in `SubscriptionGate`:

```tsx
// app/(app)/exam/live/[examId].tsx
export default function LiveExamPage() {
  return (
    <SubscriptionGate featureName="Live Exam">
      <LiveExamScreen />
    </SubscriptionGate>
  );
}

// Inline gate example:
<SubscriptionGate featureName="Leaderboard Advanced Stats" inline>
  <LeaderboardAdvancedStats />
</SubscriptionGate>
```

---

## ✅ Completion Checklist

- [ ] `EntitlementStatus`, `SubscriptionPackage` types created
- [ ] `subscriptionApi.ts` — `getEntitlementStatus` calls `get_entitlement_status` RPC
- [ ] `useSubscriptionStore` — fail-closed (defaults to `false`)
- [ ] `SubscriptionGate` — fullscreen + inline modes + grace period banner
- [ ] `PaywallScreen` — hero, feature table, plan cards, bKash CTA
- [ ] Live Exam route wrapped in `SubscriptionGate`
- [ ] RevenueCat TODOs marked with `// TODO(revenuecat):` comments
- [ ] Subscription checked on app launch (in root layout)

---

## 🔗 Next: [16_BKASH_PAYMENT.md](./16_BKASH_PAYMENT.md)
