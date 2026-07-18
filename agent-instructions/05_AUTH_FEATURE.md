# 05 — Auth Feature (Agent 5)

> **Agent:** Agent 5  
> **Prerequisite:** Agents 1, 2, 3, 4 complete  
> **Flutter Source:** `src/lib/features/auth/`  
> **Output:** Login screen, register screen, Google OAuth, Facebook OAuth, session management

---

## 📋 Tasks

- [ ] Create `AuthUser` TypeScript type
- [ ] Create `authApi.ts` (Supabase Auth calls)
- [ ] Create `useAuthStore` (Zustand — replaces `AuthNotifier`)
- [ ] Build Login screen
- [ ] Build Register screen
- [ ] Implement Google OAuth
- [ ] Implement Facebook OAuth
- [ ] Implement Password Reset flow
- [ ] Configure auth-aware routing

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `AuthUser` entity | `AuthUser` TypeScript interface |
| `AuthRepository` | `authApi.ts` functions |
| `AuthNotifier` (Riverpod) | `useAuthStore` (Zustand) |
| `AuthState` sealed class | `AuthState` union type |
| `login_screen.dart` | `app/(auth)/login.tsx` |
| `register_screen.dart` | `app/(auth)/register.tsx` |
| `signInWithGoogle` | `expo-auth-session` + Supabase |
| `signInWithFacebook` | `expo-auth-session` + Supabase |
| GoRouter redirects | Expo Router `(auth)` / `(app)` groups |

---

## 🛠️ Implementation

### Step 1: Auth Types

**`src/features/auth/types/auth.types.ts`**
```typescript
export interface AuthUser {
  id: string;
  email: string;
  provider: string;
  isEmailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
}

export type AuthStatus =
  | 'initial'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
}
```

---

### Step 2: Auth API

**`src/features/auth/api/auth.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { AuthUser } from '../types/auth.types';

function mapToAuthUser(user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    provider: user.app_metadata?.provider ?? 'email',
    isEmailVerified: user.email_confirmed_at != null,
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatarUrl: user.user_metadata?.avatar_url,
  };
}

export const authApi = {
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return mapToAuthUser(data.user);
  },

  async signUpWithEmail(email: string, password: string, fullName: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');
    return mapToAuthUser(data.user);
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URI,
    });
    if (error) throw error;
  },

  // OAuth providers handled in the store via expo-auth-session
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(mapToAuthUser(session.user));
      } else {
        callback(null);
      }
    });
  },
};
```

---

### Step 3: Auth Store (Zustand)

**`src/features/auth/store/auth.store.ts`**
```typescript
import { create } from 'zustand';
import { AuthState, AuthUser } from '../types/auth.types';
import { authApi } from '../api/auth.api';

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setLoading: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  status: 'initial',
  user: null,
  error: null,

  setLoading: () => set({ status: 'loading', error: null }),

  setUser: (user) =>
    set({
      status: user ? 'authenticated' : 'unauthenticated',
      user,
      error: null,
    }),

  signIn: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const user = await authApi.signInWithEmail(email, password);
      set({ status: 'authenticated', user, error: null });
    } catch (e: any) {
      set({ status: 'error', error: e.message ?? 'Login failed', user: null });
      throw e;
    }
  },

  signUp: async (email, password, fullName) => {
    set({ status: 'loading', error: null });
    try {
      const user = await authApi.signUpWithEmail(email, password, fullName);
      set({ status: 'authenticated', user, error: null });
    } catch (e: any) {
      set({ status: 'error', error: e.message ?? 'Sign up failed', user: null });
      throw e;
    }
  },

  signOut: async () => {
    await authApi.signOut();
    set({ status: 'unauthenticated', user: null, error: null });
  },

  resetPassword: async (email) => {
    await authApi.resetPassword(email);
  },
}));
```

---

### Step 4: Login Screen

**`app/(auth)/login.tsx`**
```tsx
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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, status, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)/home');
    } catch {
      // Error is already in store
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

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
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
});
```

---

### Step 5: Google OAuth

Install:
```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

**`src/features/auth/hooks/useGoogleAuth.ts`**
```typescript
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/core/supabase/client';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URI,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL');

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      process.env.EXPO_PUBLIC_AUTH_REDIRECT_URI!,
    );

    if (result.type === 'success') {
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    }
  };

  return { signInWithGoogle };
}
```

---

### Step 6: Session Listener in Root Layout

Update `app/_layout.tsx` to listen for auth state changes and redirect:

```tsx
// Add to _layout.tsx
import { useEffect } from 'react';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useRouter, useSegments } from 'expo-router';

function AuthListener() {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segments[0] === '(auth)';
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, provider: 'email', isEmailVerified: true });
        if (inAuthGroup) router.replace('/(app)/home');
      } else {
        setUser(null);
        if (!inAuthGroup) router.replace('/(auth)/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [segments]);

  return null;
}
```

---

## ✅ Completion Checklist

- [ ] `src/features/auth/types/auth.types.ts` created
- [ ] `src/features/auth/api/auth.api.ts` created
- [ ] `src/features/auth/store/auth.store.ts` created (Zustand)
- [ ] `app/(auth)/login.tsx` built with form validation
- [ ] `app/(auth)/register.tsx` built
- [ ] `app/(auth)/forgot-password.tsx` built
- [ ] Google OAuth working via `expo-auth-session`
- [ ] Facebook OAuth working via `expo-auth-session`
- [ ] Session listener in root layout redirects correctly
- [ ] Sign out tested (redirects to login)

---

## 🔗 Next: [06_PROFILE_FEATURE.md](./06_PROFILE_FEATURE.md)
