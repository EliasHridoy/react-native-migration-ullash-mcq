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
    if (user?.id && status === 'idle') {
      checkEntitlement(user.id);
    }
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
        <TouchableOpacity onPress={() => router.push('/paywall' as any)} style={styles.unlockBtn}>
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
        onPress={() => router.push('/paywall' as any)}
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
