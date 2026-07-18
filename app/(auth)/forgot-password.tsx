import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';
import { Typography } from '@/core/theme/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
      Alert.alert('Success', 'Password reset instructions have been sent to your email.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to send password reset email.');
    } finally {
      setLoading(false);
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
        {/* Logo / Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive recovery instructions
          </Text>
        </View>

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              A password reset link has been sent to {email}. Please check your inbox and follow the instructions to reset your password.
            </Text>
            <GradientButton
              label="Back to Sign In"
              onPress={() => router.replace('/(auth)/login' as any)}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <GradientButton
              label="Send Recovery Link"
              onPress={handleResetPassword}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        {!success && (
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.loginText}>
              Remember your password? <Text style={{ color: Colors.primary }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { ...Typography.displayMedium, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  form: { gap: 12 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  successBox: {
    backgroundColor: 'rgba(81,207,102,0.1)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    color: Colors.textPrimary,
    ...Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 24, ...Typography.bodyMedium },
});
