import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/core/supabase/client';
import { Colors } from '@/core/theme/colors';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/home' as any);
      } else {
        router.replace('/(auth)/login' as any);
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}
