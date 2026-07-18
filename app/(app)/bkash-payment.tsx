import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
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
import { BkashPaymentStatus } from '@/features/payment/types/bkash.types';

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = ['Create Payment', 'Authorize PIN', 'Confirm'];
  return (
    <View style={styles.steps}>
      {steps.map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepDot, i + 1 <= currentStep && styles.stepDotActive]}>
            <Text style={styles.stepNum}>{i + 1}</Text>
          </View>
          <Text style={[styles.stepLabel, i + 1 === currentStep && styles.stepLabelActive]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Step Map ─────────────────────────────────────────────────────────────────

const stepMap: Record<BkashPaymentStatus, 1 | 2 | 3> = {
  idle: 1,
  initiating: 1,
  awaitingUserAction: 2,
  executing: 3,
  completed: 3,
  failed: 1,
};

// ─── CTA Label Helper ─────────────────────────────────────────────────────────

function getCtaLabel(status: BkashPaymentStatus): string {
  switch (status) {
    case 'idle':
      return 'Pay with bKash';
    case 'initiating':
      return 'Creating payment...';
    case 'awaitingUserAction':
      return 'I completed my PIN';
    case 'executing':
      return 'Verifying payment...';
    default:
      return 'Try Again';
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function BkashPaymentScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const store = useBkashPaymentStore();
  const { checkEntitlement } = useSubscriptionStore();

  const effectivePlanId = planId ?? 'monthly';
  const amount =
    effectivePlanId === 'annual'
      ? AppConstants.bkashAmountAnnual
      : AppConstants.bkashAmountMonthly;

  const handleStartPayment = async () => {
    try {
      const url = await store.initializePayment(effectivePlanId, amount);
      // Open bKash URL in external browser — supports deep linking into the bKash app
      await WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'done',
        toolbarColor: '#E2136E',
      });
      // After browser closes, trigger execute
      await store.executePayment();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred';
      Alert.alert('Payment Error', message);
    }
  };

  const handleCtaPress = () => {
    if (store.status === 'awaitingUserAction') {
      void store.executePayment();
    } else if (store.status === 'failed') {
      store.reset();
    } else {
      void handleStartPayment();
    }
  };

  // Reset store on unmount to avoid stale state
  useEffect(() => {
    return () => {
      store.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On success: refresh entitlement and navigate home
  useEffect(() => {
    if (store.status === 'completed' && user?.id) {
      void checkEntitlement(user.id);
      const timer = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/(app)/home' as any);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [store.status, user?.id]);

  const isLoading = store.status === 'initiating' || store.status === 'executing';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* bKash Branding Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.bkashLogo}>
            <Text style={styles.bkashLogoText}>bKash</Text>
          </View>
          <Text style={styles.title}>Complete Payment</Text>
        </Animated.View>

        {/* Step Indicator */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <StepIndicator currentStep={stepMap[store.status]} />
        </Animated.View>

        {/* Plan Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <GlassCard style={styles.planCard}>
            <Text style={styles.planLabel}>
              {effectivePlanId === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
            </Text>
            <Text style={styles.planAmount}>৳{amount.toFixed(2)}</Text>
            <Text style={styles.planPeriod}>
              {effectivePlanId === 'annual' ? 'per year' : 'per month'}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Error Message */}
        {store.error && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <GlassCard style={styles.errorCard}>
              <Text style={styles.errorText}>⚠️ {store.error}</Text>
              {store.invoiceNumber && (
                <Text style={styles.invoiceText}>Invoice: {store.invoiceNumber}</Text>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Success State */}
        {store.status === 'completed' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.successCard}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>Your Premium access is now active.</Text>
          </Animated.View>
        )}

        {/* CTA Button */}
        {store.status !== 'completed' && (
          <GradientButton
            label={getCtaLabel(store.status)}
            onPress={handleCtaPress}
            loading={isLoading}
            variant={store.status === 'failed' ? 'danger' : 'primary'}
            style={styles.ctaButton}
          />
        )}

        {/* Step 2 Instructions */}
        {store.status === 'awaitingUserAction' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <GlassCard style={styles.instructionCard}>
              <Text style={styles.instruction}>
                1. Complete your bKash PIN in the browser{'\n'}
                2. Return to this app{'\n'}
                3. Tap &quot;I completed my PIN&quot; to verify
              </Text>
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bkashLogo: {
    backgroundColor: '#E2136E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  bkashLogoText: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },

  // Step Indicator
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: '#E2136E',
    borderColor: '#E2136E',
  },
  stepNum: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#E2136E',
  },

  // Plan Card
  planCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  planLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontFamily: 'Inter_500Medium',
  },
  planAmount: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: '#E2136E',
  },
  planPeriod: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },

  // Error Card
  errorCard: {
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
  },
  invoiceText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },

  // Success State
  successCard: {
    alignItems: 'center',
    marginTop: 24,
    padding: 32,
  },
  successIcon: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.success,
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },

  // CTA
  ctaButton: {
    marginTop: 24,
  },

  // Instructions
  instructionCard: {
    marginTop: 16,
  },
  instruction: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
});
