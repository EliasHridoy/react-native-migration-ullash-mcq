import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, Alert, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';
import { Spacing, BorderRadius, Shadows } from '@/core/theme/spacing';
import { Typography } from '@/core/theme/typography';
import { useRocketPaymentStore } from '@/features/payment/store/rocket-payment.store';
import { rocketApi } from '@/features/payment/api/rocket.api';
import { RocketTransactionList } from '@/features/payment/components/RocketTransactionList';
import { RocketTransaction } from '@/features/payment/types/rocket.types';
import { useSubscriptionStore } from '@/features/subscription/store/subscription.store';
import { useAuthStore } from '@/features/auth/store/auth.store';

const ROCKET_BRAND = '#8C3494';

export default function RocketPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId: string; amount: string }>();
  const { user } = useAuthStore();
  const { checkEntitlement } = useSubscriptionStore();
  const { status, error, initializePayment, executePayment, reset } = useRocketPaymentStore();
  const [transactions, setTransactions] = useState<RocketTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const planId = params.planId ?? '';
  const amount = parseFloat(params.amount ?? '0');

  useEffect(() => {
    loadTx();
    return () => { reset(); };
  }, []);

  const loadTx = async () => {
    setTxLoading(true);
    try { setTransactions(await rocketApi.getTransactions()); } catch { /* ok */ }
    setTxLoading(false);
  };

  const handleInit = async () => {
    if (!planId || amount <= 0) { Alert.alert('Error', 'Invalid plan'); return; }
    try {
      const url = await initializePayment(planId, amount);
      if (url) await Linking.openURL(url);
    } catch { /* store has error */ }
  };

  const handleExec = async () => {
    await executePayment();
    if (useRocketPaymentStore.getState().status === 'completed') {
      if (user?.id) await checkEntitlement(user.id);
      await loadTx();
      Alert.alert('Success 🎉', 'Premium activated.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  const msg = (): string => {
    if (status === 'initiating') return 'Creating payment…';
    if (status === 'awaitingUserAction') return 'Complete in Rocket app, then tap Confirm';
    if (status === 'executing') return 'Verifying…';
    if (status === 'completed') return 'Payment successful!';
    if (status === 'failed') return error ?? 'Payment failed';
    return '';
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Animated.View entering={FadeInDown.duration(500)} style={s.hdr}>
          <Text style={s.emoji}>🚀</Text>
          <Text style={s.title}>Pay with Rocket</Text>
          <Text style={s.sub}>Dutch-Bangla Bank MFS</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <GlassCard style={s.card}>
            <View style={s.row}><Text style={s.lbl}>Plan</Text><Text style={s.val}>{planId}</Text></View>
            <View style={[s.row, s.rowLast]}><Text style={s.lbl}>Amount</Text><Text style={s.amt}>৳{amount.toFixed(2)}</Text></View>
          </GlassCard>
        </Animated.View>
        {status !== 'idle' && (
          <GlassCard style={s.statCard}>
            <Text style={[s.statTxt, status === 'completed' && { color: Colors.success }, status === 'failed' && { color: Colors.error }]}>{msg()}</Text>
          </GlassCard>
        )}
        <View style={s.cta}>
          {status === 'idle' && (
            <TouchableOpacity onPress={handleInit} style={s.rBtn} activeOpacity={0.85}>
              <LinearGradient colors={[ROCKET_BRAND, '#6B2575']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.rGrad}>
                <Text style={s.rTxt}>Pay ৳{amount.toFixed(2)} with Rocket</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
          {status === 'awaitingUserAction' && <GradientButton label="Confirm Payment" onPress={handleExec} variant="accent" />}
          {(status === 'failed' || status === 'completed') && <GradientButton label={status === 'completed' ? 'Done' : 'Try Again'} onPress={() => { reset(); if (status === 'completed') router.back(); }} variant={status === 'completed' ? 'accent' : 'primary'} />}
          {(status === 'initiating' || status === 'executing') && <GradientButton label="Processing…" onPress={() => {}} loading disabled />}
        </View>
        <Text style={s.hTitle}>Transaction History</Text>
        <RocketTransactionList transactions={transactions} loading={txLoading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  back: { paddingVertical: Spacing.md, alignSelf: 'flex-start' },
  hdr: { alignItems: 'center', paddingVertical: Spacing.lg },
  emoji: { fontSize: 56, marginBottom: Spacing.md },
  title: { ...Typography.displayMedium, color: Colors.textPrimary },
  sub: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing.xs },
  card: { padding: Spacing.md, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowLast: { borderBottomWidth: 0 },
  lbl: { ...Typography.bodyMedium, color: Colors.textSecondary },
  val: { ...Typography.headlineSmall, color: Colors.textPrimary, textTransform: 'capitalize' },
  amt: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.accent },
  statCard: { padding: Spacing.md, marginBottom: Spacing.md, alignItems: 'center' },
  statTxt: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center' },
  cta: { marginBottom: Spacing.xl },
  rBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.button },
  rGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, paddingVertical: 16, borderRadius: BorderRadius.md },
  rTxt: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.white },
  hTitle: { ...Typography.headlineMedium, color: Colors.textPrimary, marginBottom: Spacing.md },
});
