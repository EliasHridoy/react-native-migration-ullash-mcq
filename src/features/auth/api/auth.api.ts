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

  async signInWithPhone(phone: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      phone, // Format: +8801XXXXXXXXX
    });
    if (error) throw error;
  },

  async verifyOtp(phone: string, token: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    if (!data.user) throw new Error('OTP verification failed');
    return mapToAuthUser(data.user);
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
