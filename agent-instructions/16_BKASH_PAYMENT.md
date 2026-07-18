# 16 — bKash MFS Payment (Agent 16)

> **Agent:** Agent 16  
> **Prerequisite:** Agent 15 (Subscription) complete  
> **Flutter Source:** `src/lib/features/payment/`  
> **Output:** bKash payment screen, 3-step flow, IPN validation, transaction history

---

## 📋 Tasks

- [ ] Create `BkashTransaction` TypeScript type
- [ ] Create `bkashApi.ts` (Edge Function calls)
- [ ] Create `useBkashPaymentStore` (Zustand state machine)
- [ ] Build bKash Payment screen (step indicator, plan card, URL launch)
- [ ] Build transaction history widget
- [ ] Add "Pay with bKash" to PaywallScreen

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `BkashTransaction` entity | `BkashTransaction` interface |
| `BkashRemoteDataSource` | `bkashApi.ts` |
| `BkashPaymentNotifier` | `useBkashPaymentStore` (Zustand) |
| `BkashPaymentState` sealed | `BkashPaymentStatus` union type |
| `bkash_payment_screen.dart` | `app/(app)/bkash-payment.tsx` |
| `url_launcher` (ExternalApplication) | `expo-web-browser` or `expo-linking` |

---

## bKash 3-Step Flow

```
Step 1: CREATE    → Edge Function: grantToken + createPayment → bkashURL returned
Step 2: USER PIN  → Open bkashURL in external browser/app
Step 3: EXECUTE   → Edge Function: executePayment + IPN validation → subscription activated
```

---

## 🛠️ Implementation

### Step 1: Types

**`src/features/payment/types/bkash.types.ts`**
```typescript
export type BkashTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type BkashPaymentStatus =
  | 'idle'
  | 'initiating'       // Step 1: Creating payment
  | 'awaitingUserAction' // Step 2: User opened bkashURL
  | 'executing'        // Step 3: Executing payment
  | 'completed'        // Success
  | 'failed';          // Failure

export interface BkashTransaction {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: 'BDT';
  paymentId?: string;
  merchantInvoiceNumber?: string;
  trxId?: string;
  status: BkashTransactionStatus;
  statusLabel: string;
  amountDisplay: string;
  createdAt: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  bkashUrl: string;
  merchantInvoiceNumber: string;
}
```

---

### Step 2: bKash API

**`src/features/payment/api/bkash.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { BkashTransaction, CreatePaymentResult } from '../types/bkash.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const bkashApi = {
  /**
   * Step 1: Creates bKash payment.
   * Edge Function: grantToken → createPayment → returns bkashURL
   */
  async createPayment(planId: string, amount: number): Promise<CreatePaymentResult> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.bkashPaymentFunction,
      {
        body: {
          action: 'create',
          plan_id: planId,
          amount: amount.toFixed(2),
        },
      }
    );
    if (error) throw error;
    if (!data?.paymentID) throw new Error('Failed to create bKash payment');
    return {
      paymentId: data.paymentID,
      bkashUrl: data.bkashURL,
      merchantInvoiceNumber: data.merchantInvoiceNumber,
    };
  },

  /**
   * Step 3: Executes bKash payment after user completes PIN entry.
   * Edge Function: executePayment → IPN validation → upsert_bkash_payment RPC → upsert_subscription RPC
   */
  async executePayment(paymentId: string, merchantInvoiceNumber: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.bkashPaymentFunction,
      {
        body: {
          action: 'execute',
          payment_id: paymentId,
          merchant_invoice_number: merchantInvoiceNumber,
        },
      }
    );
    if (error) throw error;
    if (data?.status !== 'Completed') {
      throw new Error(`Payment failed: ${data?.statusMessage ?? 'Unknown error'}`);
    }
  },

  /**
   * Fetch transaction history for current user.
   */
  async getTransactions(): Promise<BkashTransaction[]> {
    const { data, error } = await supabase.rpc(SupabaseConstants.rpcGetBkashTransactions);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      amount: row.amount,
      currency: 'BDT',
      paymentId: row.payment_id,
      merchantInvoiceNumber: row.merchant_invoice_number,
      trxId: row.trx_id,
      status: row.status,
      statusLabel: row.status === 'completed' ? 'Completed' : row.status === 'failed' ? 'Failed' : 'Pending',
      amountDisplay: `৳${parseFloat(row.amount).toFixed(2)}`,
      createdAt: row.created_at,
    }));
  },
};
```

---

### Step 3: bKash Payment Store

**`src/features/payment/store/bkash-payment.store.ts`**
```typescript
import { create } from 'zustand';
import { BkashPaymentStatus, CreatePaymentResult, BkashTransaction } from '../types/bkash.types';
import { bkashApi } from '../api/bkash.api';

interface BkashPaymentState {
  status: BkashPaymentStatus;
  paymentResult: CreatePaymentResult | null;
  completedTransaction: BkashTransaction | null;
  error: string | null;
  invoiceNumber: string | null;
}

interface BkashPaymentActions {
  initializePayment: (planId: string, amount: number) => Promise<string>; // Returns bkashUrl
  executePayment: () => Promise<void>;
  reset: () => void;
}

export const useBkashPaymentStore = create<BkashPaymentState & BkashPaymentActions>((set, get) => ({
  status: 'idle',
  paymentResult: null,
  completedTransaction: null,
  error: null,
  invoiceNumber: null,

  initializePayment: async (planId, amount) => {
    set({ status: 'initiating', error: null });
    try {
      const result = await bkashApi.createPayment(planId, amount);
      set({
        status: 'awaitingUserAction',
        paymentResult: result,
        invoiceNumber: result.merchantInvoiceNumber,
      });
      return result.bkashUrl;
    } catch (e: any) {
      set({ status: 'failed', error: e.message });
      throw e;
    }
  },

  executePayment: async () => {
    const { paymentResult } = get();
    if (!paymentResult) return;

    set({ status: 'executing' });
    try {
      await bkashApi.executePayment(paymentResult.paymentId, paymentResult.merchantInvoiceNumber);
      set({ status: 'completed', error: null });
    } catch (e: any) {
      set({ status: 'failed', error: e.message });
    }
  },

  reset: () => set({ status: 'idle', paymentResult: null, error: null, invoiceNumber: null }),
}));
```

---

### Step 4: bKash Payment Screen

**`app/(app)/bkash-payment.tsx`**
```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBkashPaymentStore } from '@/features/payment/store/bkash-payment.store';
import { useSubscriptionStore } from '@/features/subscription/store/subscription.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';
import { AppConstants } from '@/core/constants/app.constants';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Step Indicator
function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = ['Create Payment', 'Authorize PIN', 'Confirm'];
  return (
    <View style={styles.steps}>
      {steps.map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepDot, i + 1 <= currentStep && styles.stepDotActive]}>
            <Text style={styles.stepNum}>{i + 1}</Text>
          </View>
          <Text style={[styles.stepLabel, i + 1 === currentStep && styles.stepLabelActive]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function BkashPaymentScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const store = useBkashPaymentStore();
  const { checkEntitlement } = useSubscriptionStore();

  const amount = planId === 'annual'
    ? AppConstants.bkashAmountAnnual
    : AppConstants.bkashAmountMonthly;

  const stepMap: Record<string, 1 | 2 | 3> = {
    idle: 1, initiating: 1,
    awaitingUserAction: 2,
    executing: 3, completed: 3, failed: 1,
  };

  const handleStartPayment = async () => {
    try {
      const url = await store.initializePayment(planId ?? 'monthly', amount);
      // Open bKash in external browser (supports deep linking to bKash app)
      await WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'done',
        toolbarColor: '#E2136E',
      });
      // After browser closes, trigger execute
      await store.executePayment();
    } catch (e: any) {
      Alert.alert('Payment Error', e.message);
    }
  };

  useEffect(() => {
    if (store.status === 'completed' && user?.id) {
      checkEntitlement(user.id); // Refresh entitlement
      setTimeout(() => router.replace('/(app)/home'), 2000);
    }
  }, [store.status]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      {/* bKash branding */}
      <View style={styles.header}>
        <View style={styles.bkashLogo}>
          <Text style={styles.bkashLogoText}>bKash</Text>
        </View>
        <Text style={styles.title}>Complete Payment</Text>
      </View>

      {/* Step Indicator */}
      <StepIndicator currentStep={stepMap[store.status] ?? 1} />

      {/* Plan Card */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <GlassCard style={styles.planCard}>
          <Text style={styles.planLabel}>{planId === 'annual' ? 'Annual Plan' : 'Monthly Plan'}</Text>
          <Text style={styles.planAmount}>৳{amount.toFixed(2)}</Text>
          <Text style={styles.planPeriod}>{planId === 'annual' ? 'per year' : 'per month'}</Text>
        </GlassCard>
      </Animated.View>

      {/* Error Message */}
      {store.error && (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {store.error}</Text>
          {store.invoiceNumber && (
            <Text style={styles.invoiceText}>Invoice: {store.invoiceNumber}</Text>
          )}
        </GlassCard>
      )}

      {/* Success State */}
      {store.status === 'completed' && (
        <Animated.View entering={FadeInDown} style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Your Premium access is now active.</Text>
        </Animated.View>
      )}

      {/* CTA Button */}
      {store.status !== 'completed' && (
        <GradientButton
          label={
            store.status === 'idle' ? 'Pay with bKash' :
            store.status === 'initiating' ? 'Creating payment...' :
            store.status === 'awaitingUserAction' ? 'I completed my PIN' :
            store.status === 'executing' ? 'Verifying payment...' :
            'Try Again'
          }
          onPress={
            store.status === 'awaitingUserAction'
              ? store.executePayment
              : store.status === 'failed'
              ? store.reset
              : handleStartPayment
          }
          loading={store.status === 'initiating' || store.status === 'executing'}
          variant={store.status === 'failed' ? 'danger' : 'primary'}
          style={{ marginTop: 24 }}
        />
      )}

      {/* Instructions */}
      {store.status === 'awaitingUserAction' && (
        <GlassCard style={{ marginTop: 16 }}>
          <Text style={styles.instruction}>
            1. Complete your bKash PIN in the browser{'\n'}
            2. Return to this app{'\n'}
            3. Tap "I completed my PIN" to verify
          </Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', marginBottom: 24 },
  bkashLogo: { backgroundColor: '#E2136E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginBottom: 12 },
  bkashLogoText: { color: Colors.white, fontSize: 20, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  steps: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  stepItem: { alignItems: 'center', gap: 6, flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  stepDotActive: { backgroundColor: '#E2136E', borderColor: '#E2136E' },
  stepNum: { color: Colors.white, fontSize: 12, fontFamily: 'Inter_700Bold' },
  stepLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  stepLabelActive: { color: '#E2136E' },
  planCard: { alignItems: 'center', paddingVertical: 24 },
  planLabel: { fontSize: 16, color: Colors.textSecondary, marginBottom: 8 },
  planAmount: { fontSize: 40, fontFamily: 'Inter_700Bold', color: '#E2136E' },
  planPeriod: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  errorCard: { marginTop: 16, borderWidth: 1, borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: 14, lineHeight: 20 },
  invoiceText: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
  successCard: { alignItems: 'center', marginTop: 24, padding: 32 },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.success, marginTop: 16 },
  successSubtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  instruction: { color: Colors.textSecondary, fontSize: 14, lineHeight: 24 },
});
```

---

### Step 5: Transaction History Widget

**`src/features/payment/components/BkashTransactionList.tsx`**
```tsx
import { useQuery } from '@tanstack/react-query';
import { bkashApi } from '../api/bkash.api';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';

export function BkashTransactionList() {
  const { data: transactions } = useQuery({
    queryKey: ['bkash-transactions'],
    queryFn: bkashApi.getTransactions,
  });

  return (
    <View>
      <Text style={styles.title}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={t => t.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <GlassCard style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.amount}>{item.amountDisplay}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={{ color: item.status === 'completed' ? Colors.success : Colors.error, fontFamily: 'Inter_600SemiBold' }}>
              {item.statusLabel}
            </Text>
          </GlassCard>
        )}
        ListEmptyComponent={<Text style={{ color: Colors.textMuted, textAlign: 'center', padding: 16 }}>No transactions yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  amount: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
```

---

## ✅ Completion Checklist

- [ ] `BkashTransaction` and `BkashPaymentStatus` types created
- [ ] `bkashApi.ts` — `createPayment`, `executePayment`, `getTransactions`
- [ ] `useBkashPaymentStore` — sealed state machine (6 states)
- [ ] bKash Payment screen — step indicator, plan card, URL launch, execute flow
- [ ] `expo-web-browser` opens bKash URL
- [ ] Success state shows after execute completes
- [ ] Subscription entitlement refreshed after successful payment
- [ ] `BkashTransactionList` widget shows on profile/paywall
- [ ] "Pay with bKash" button on PaywallScreen navigates to this screen

---

## 🔗 Next: [17_PENDING_FEATURES.md](./17_PENDING_FEATURES.md)
