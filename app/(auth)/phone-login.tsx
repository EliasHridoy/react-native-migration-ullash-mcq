import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';
import { Typography } from '@/core/theme/typography';
import { Spacing, BorderRadius } from '@/core/theme/spacing';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { authApi } from '@/features/auth/api/auth.api';

type PhoneLoginStep = 'phone' | 'otp';

const OTP_LENGTH = 6;

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { setLoading, setUser } = useAuthStore();
  const [step, setStep] = useState<PhoneLoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const fullPhone = `+880${phone.replace(/^0/, '')}`;

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid Bangladeshi phone number');
      return;
    }
    setLoadingState(true);
    setError(null);
    try {
      await authApi.signInWithPhone(fullPhone);
      setStep('otp');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to send OTP';
      setError(message);
    } finally {
      setLoadingState(false);
    }
  };

  const handleVerifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the full 6-digit code');
      return;
    }
    setLoadingState(true);
    setError(null);
    setLoading();
    try {
      const user = await authApi.verifyOtp(fullPhone, token);
      setUser(user);
      router.replace('/(app)/home' as never);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'OTP verification failed';
      setError(message);
      useAuthStore.setState({ status: 'error', error: message });
    } finally {
      setLoadingState(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    // Handle paste — if text is multi-character, fill boxes
    if (text.length > 1) {
      const chars = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      chars.forEach((char, i) => {
        if (i + index < OTP_LENGTH) {
          newOtp[i + index] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = text.replace(/\D/g, '');
    setOtp(newOtp);

    // Auto-focus next
    if (text && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <LinearGradient
        colors={['#0A0A1A', '#1A0A2E', '#0A0A1A']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>Phone Login</Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? 'Enter your Bangladeshi mobile number to receive an OTP'
              : `Enter the 6-digit code sent to ${fullPhone}`}
          </Text>
        </Animated.View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 'phone' ? (
          /* Phone Input Step */
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.form}>
            <View style={styles.phoneRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>🇧🇩 +880</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="1XXXXXXXXX"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                keyboardType="phone-pad"
                maxLength={11}
                autoFocus
              />
            </View>
            <GradientButton
              label="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              disabled={phone.length < 10}
              style={{ marginTop: Spacing.md }}
            />
          </Animated.View>
        ) : (
          /* OTP Input Step */
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.form}>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpInputRefs.current[index] = ref; }}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textContentType="oneTimeCode"
                  autoFocus={index === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            <GradientButton
              label="Verify OTP"
              onPress={handleVerifyOtp}
              loading={loading}
              disabled={otp.join('').length !== OTP_LENGTH}
              style={{ marginTop: Spacing.lg }}
            />

            <GradientButton
              label="Resend OTP"
              onPress={handleSendOtp}
              loading={loading}
              variant="accent"
              style={{ marginTop: Spacing.sm }}
            />
          </Animated.View>
        )}

        {/* Back to login */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <GradientButton
            label="← Back to Login"
            onPress={() => router.back()}
            variant="accent"
            style={{ marginTop: Spacing.xl }}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    ...Typography.bodySmall,
  },
  form: {
    gap: Spacing.md,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  prefixBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  prefixText: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: 14,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    letterSpacing: 1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
});
