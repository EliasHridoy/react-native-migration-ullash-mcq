import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { Spacing, BorderRadius, Shadows } from '@/core/theme/spacing';
import { useSubscriptionStore } from '@/features/subscription/store/subscription.store';
import { SubscriptionPackage } from '@/features/subscription/types/subscription.types';

// Feature comparison data
const FEATURES = [
  { name: 'Daily Quizzes', free: true, premium: true },
  { name: 'Public Leaderboard', free: true, premium: true },
  { name: 'AI Hints (Mitro)', free: false, premium: true },
  { name: 'Live Exams', free: false, premium: true },
  { name: 'Study Materials', free: false, premium: true },
  { name: 'Weakness Analysis', free: false, premium: true },
  { name: 'Micro-Practice', free: false, premium: true },
  { name: 'Advanced Stats', free: false, premium: true },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const { packages, loadPackages } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('annual');

  useEffect(() => {
    loadPackages();
  }, []);

  const handleBkashPayment = () => {
    const selected = packages.find((p) => p.id === selectedPlan);
    if (!selected) return;
    router.push({
      pathname: '/(app)/bkash-payment' as const,
      params: { planId: selected.id, amount: String(selected.priceAmount) },
    } as any);
  };

  const handleRocketPayment = () => {
    const selected = packages.find((p) => p.id === selectedPlan);
    if (!selected) return;
    router.push({
      pathname: '/(app)/rocket-payment' as const,
      params: { planId: selected.id, amount: String(selected.priceAmount) },
    } as any);
  };

  const handleNagadPayment = () => {
    const selected = packages.find((p) => p.id === selectedPlan);
    if (!selected) return;
    router.push({
      pathname: '/(app)/nagad-payment' as const,
      params: { planId: selected.id, amount: String(selected.priceAmount) },
    } as any);
  };

  const handleRestorePurchases = () => {
    // TODO(revenuecat): Implement restore purchases with RevenueCat SDK
    Alert.alert(
      'Restore Purchases',
      'RevenueCat SDK is not yet integrated. If you have paid via bKash, your subscription will be activated automatically.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🚀</Text>
          <Text style={styles.heroTitle}>Unlock Your Potential</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited access to all premium features and supercharge your exam preparation.
          </Text>
        </Animated.View>

        {/* Feature Comparison Table */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <GlassCard style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>Free vs Premium</Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.featureColumn]}>Feature</Text>
              <Text style={[styles.tableHeaderText, styles.planColumn]}>Free</Text>
              <Text style={[styles.tableHeaderText, styles.planColumn, { color: Colors.accent }]}>
                Premium
              </Text>
            </View>

            {/* Table Rows */}
            {FEATURES.map((feature, index) => (
              <View
                key={feature.name}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven,
                ]}
              >
                <Text style={[styles.featureText, styles.featureColumn]}>{feature.name}</Text>
                <View style={styles.planColumn}>
                  {feature.free ? (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  ) : (
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  )}
                </View>
                <View style={styles.planColumn}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Plan Cards */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.plansSection}>
          <Text style={styles.plansTitle}>Choose Your Plan</Text>

          <View style={styles.planCards}>
            {packages.map((pkg) => (
              <PlanCard
                key={pkg.id}
                package_={pkg}
                isSelected={selectedPlan === pkg.id}
                onSelect={() => setSelectedPlan(pkg.id)}
                isBestValue={pkg.period === 'annual'}
              />
            ))}
          </View>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.ctaSection}>
          <TouchableOpacity
            onPress={handleBkashPayment}
            style={styles.bkashButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.bkash, '#C4115C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bkashGradient}
            >
              <Text style={styles.bkashButtonText}>Pay with bKash</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRocketPayment}
            style={styles.rocketButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.rocket, '#6B2575']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rocketGradient}
            >
              <Text style={styles.rocketButtonText}>Pay with Rocket</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNagadPayment}
            style={styles.nagadButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.nagad, '#D97B0A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nagadGradient}
            >
              <Text style={styles.nagadButtonText}>Pay with Nagad</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButton}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer disclaimer */}
        <Text style={styles.disclaimer}>
          By subscribing, you agree to our Terms of Service. Subscription auto-renews unless
          cancelled. Contact support for any billing issues.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------- Plan Card Component ---------------

interface PlanCardProps {
  package_: SubscriptionPackage;
  isSelected: boolean;
  onSelect: () => void;
  isBestValue: boolean;
}

function PlanCard({ package_, isSelected, onSelect, isBestValue }: PlanCardProps) {
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.8} style={{ flex: 1 }}>
      <View
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
        ]}
      >
        {isBestValue && (
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>
        )}

        <Text style={styles.planTitle}>{package_.title}</Text>
        <Text style={styles.planPrice}>{package_.priceDisplay}</Text>

        {isBestValue && (
          <Text style={styles.planSaving}>Save 33%</Text>
        )}

        {/* Selection indicator */}
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// --------------- Styles ---------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    alignSelf: 'flex-start',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },

  // Comparison Table
  comparisonCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  comparisonTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: Spacing.xs,
  },
  tableHeaderText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  featureColumn: {
    flex: 2,
  },
  planColumn: {
    flex: 1,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  tableRowEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },

  // Plans
  plansSection: {
    marginBottom: Spacing.lg,
  },
  plansTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  planCards: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0, 210, 211, 0.06)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  bestValueText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.background,
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  planPrice: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  planSaving: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  radioOuterSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },

  // CTA
  ctaSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bkashButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.button,
  },
  bkashGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
  },
  bkashButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
  rocketButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.button,
  },
  rocketGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
  },
  rocketButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
  nagadButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.button,
  },
  nagadGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
  },
  nagadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },

  // Disclaimer
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textDisabled,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.lg,
  },
});
