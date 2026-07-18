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
import { useNagadPaymentStore } from '@/features/payment/store/nagad-payment.store';
import { nagadApi } from '@/features/payment/api/nagad.api';
import { NagadTransactionList } from '@/features/payment/components/NagadTransactionList';
import { NagadTransaction } from '@/features/payment/types/nagad.types';
import { useSubscriptionStore } from '@/features/subscription/store/subscription.store';
import { useAuthStore } from '@/features/auth/store/auth.store';

const NAGAD_BRAND = '#F6921E';

export default function NagadPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId: string; amount: string }>();
  const { user } = useAuthStore();
  const { checkEntitlement } = useSubscriptionStore();
  const { status, error, initializePayment, executePayment, reset } = useNagadPaymentStore();
  const [transactions, setTransactions] = useState<NagadTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const planId = params.planId ?? '';
  const amount = parseFloat(params.amount ?? '0');

  useEffect(() => {
    loadTx();
    return () => { reset(); };
  }, []);

  const loadTx = async () => {
    setTxLoading(true);
    try { setTransactions(await nagadApi.getTransactions()); } catch { /* ok */ }
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
    if (useNagadPaymentStore.getState().status === 'completed') {
      if (user?.id) await checkEntitlement(user.id);
      await loadTx();
      Alert.alert('Success 🎉', 'Premium activated.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  const msg = (): string => {
    if (status === 'initiating') return 'Initializing Nagad payment…';
    if (status === 'awaitingUserAction') return 'Complete in Nagad app, then tap Confirm';
    if (status === 'executing') return 'Verifying…';
    if (status === 'completed') return 'Payment successful!';
    if (status === 'failed') return error ?? 'Payment failed';
    return '';
  };

  return (
    <SafeAreaView style={st.root}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={st.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Animated.View entering={FadeInDown.duration(500)} style={st.hdr}>
          <Text style={st.emoji}>💳</Text>
          <Text style={st.title}>Pay with Nagad</Text>
          <Text style={st.sub}>Bangladesh Post Office Digital Financial Service</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <GlassCard style={st.card}>
            <View style={st.row}><Text style={st.lbl}>Plan</Text><Text style={st.val}>{planId}</Text></View>
            <View style={[st.row, st.rowLast]}><Text style={st.lbl}>Amount</Text><Text style={st.amt}>৳{amount.toFixed(2)}</Text></View>
          </GlassCard>
        </Animated.View>
        {status !== 'idle' && (
          <GlassCard style={st.statCard}>
            <Text style={[st.statTxt, status === 'completed' && { color: Colors.success }, status === 'failed' && { color: Colors.error }]}>{msg()}</Text>
          </GlassCard>
        )}
        <View style={st.cta}>
          {status === 'idle' && (
            <TouchableOpacity onPress={handleInit} style={st.nBtn} activeOpacity={0.85}>
              <LinearGradient colors={[NAGAD_BRAND, '#D97B0A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.nGrad}>
                <Text style={st.nTxt}>Pay ৳{amount.toFixed(2)} with Nagad</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
          {status === 'awaitingUserAction' && <GradientButton label="Confirm Payment" onPress={handleExec} variant="accent" />}
          {(status === 'failed' || status === 'completed') && <GradientButton label={status === 'completed' ? 'Done' : 'Try Again'} onPress={() => { reset(); if (status === 'completed') router.back(); }} variant={status === 'completed' ? 'accent' : 'primary'} />}
          {(status === 'initiating' || status === 'executing') && <GradientButton label="Processing…" onPress={() => {}} loading disabled />}
        </View>
        <Text style={st.hTitle}>Transaction History</Text>
        <NagadTransactionList transactions={transactions} loading={txLoading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  back: { paddingVertical: Spacing.md, alignSelf: 'flex-start' },
  hdr: { alignItems: 'center', paddingVertical: Spacing.lg },
  emoji: { fontSize: 56, marginBottom: Spacing.md },
  title: { ...Typography.displayMedium, color: Colors.textPrimary },
  sub: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  card: { padding: Spacing.md, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowLast: { borderBottomWidth: 0 },
  lbl: { ...Typography.bodyMedium, color: Colors.textSecondary },
  val: { ...Typography.headlineSmall, color: Colors.textPrimary, textTransform: 'capitalize' },
  amt: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.accent },
  statCard: { padding: Spacing.md, marginBottom: Spacing.md, alignItems: 'center' },
  statTxt: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center' },
  cta: { marginBottom: Spacing.xl },
  nBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.button },
  nGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, paddingVertical: 16, borderRadius: BorderRadius.md },
  nTxt: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.white },
  hTitle: { ...Typography.headlineMedium, color: Colors.textPrimary, marginBottom: Spacing.md },
});
