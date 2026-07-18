import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProfileStore } from '@/features/profile/store/profile.store';
import { useSubscriptionStore } from '@/features/subscription/store/subscription.store';
import * as Sentry from '@sentry/react-native';
import '../global.css'; // NativeWind

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://placeholder@sentry.io/mock',
  debug: false,
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 }, // 5 min stale
  },
});

function AuthListener() {
  const { setUser } = useAuthStore();
  const { ensureProfile, clearProfile } = useProfileStore();
  const { checkEntitlement } = useSubscriptionStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const inAuthGroup = (segments[0] as string) === '(auth)';
      if (session?.user) {
        const { user } = session;
        setUser({
          id: user.id,
          email: user.email ?? '',
          provider: user.app_metadata?.provider ?? 'email',
          isEmailVerified: user.email_confirmed_at != null,
          displayName: user.user_metadata?.full_name ?? user.user_metadata?.name,
          avatarUrl: user.user_metadata?.avatar_url,
        });

        // Auto-create profile if first login
        try {
          await ensureProfile(
            user.id,
            user.email ?? '',
            user.user_metadata?.full_name ?? user.user_metadata?.name,
            user.user_metadata?.avatar_url
          );
        } catch (profileError) {
          console.error('Failed to ensure profile:', profileError);
        }

        // Check subscription entitlement on auth
        checkEntitlement(user.id).catch((err) =>
          console.error('Failed to check entitlement:', err)
        );

        if (inAuthGroup) {
          router.replace('/(app)/home' as any);
        }
      } else {
        setUser(null);
        clearProfile();
        if (segments.length > 0 && (segments[0] as string) !== '(auth)') {
          router.replace('/(auth)/login' as any);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [segments, setUser, ensureProfile, clearProfile, router]);

  return null;
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
