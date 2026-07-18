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
