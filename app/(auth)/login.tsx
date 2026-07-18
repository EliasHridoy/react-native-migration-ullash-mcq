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
import { useGoogleAuth } from '@/features/auth/hooks/useGoogleAuth';
import { useFacebookAuth } from '@/features/auth/hooks/useFacebookAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, status, error, setLoading } = useAuthStore();
  const { signInWithGoogle } = useGoogleAuth();
  const { signInWithFacebook } = useFacebookAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)/home' as any);
    } catch {
      // Error is already in store
    }
  };

  const handleGoogleLogin = async () => {
    setLoading();
    try {
      await signInWithGoogle();
      // On success, the session listener in root layout will transition the route.
    } catch (e: any) {
      useAuthStore.setState({ status: 'error', error: e.message ?? 'Google sign in failed' });
    }
  };

  const handleFacebookLogin = async () => {
    setLoading();
    try {
      await signInWithFacebook();
      // On success, the session listener in root layout will transition the route.
    } catch (e: any) {
      useAuthStore.setState({ status: 'error', error: e.message ?? 'Facebook sign in failed' });
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
          <Text style={styles.title}>Ullash Live MCQ</Text>
          <Text style={styles.subtitle}>Bangladesh's Premier Exam Platform</Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
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
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <GradientButton
            label="Sign In"
            onPress={handleLogin}
            loading={status === 'loading'}
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Social Logins */}
        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsRow}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.socialButton, { marginTop: 12 }]}
            onPress={() => router.push('/(auth)/phone-login' as any)}
          >
            <Text style={styles.socialButtonText}>📱 Login with Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={{ color: Colors.primary }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { ...Typography.displayMedium, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: 8 },
  errorBox: { backgroundColor: 'rgba(255,107,107,0.15)', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.error, ...Typography.bodySmall },
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
  link: { color: Colors.textSecondary, textAlign: 'center', marginTop: 12, ...Typography.bodySmall },
  registerText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 24, ...Typography.bodyMedium },
  socialSection: { marginTop: 32 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { color: Colors.textMuted, paddingHorizontal: 12, ...Typography.bodySmall },
  socialButtonsRow: { flexDirection: 'row', gap: 12 },
  socialButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
});
