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
