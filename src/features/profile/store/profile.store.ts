import { create } from 'zustand';
import { UserProfile, ProfileStatus } from '../types/profile.types';
import { profileApi } from '../api/profile.api';

interface ProfileState {
  status: ProfileStatus;
  profile: UserProfile | null;
  error: string | null;
}

interface ProfileActions {
  loadProfile: (userId: string) => Promise<void>;
  ensureProfile: (userId: string, email: string, displayName?: string, avatarUrl?: string) => Promise<void>;
  updateProfile: (updates: { fullName?: string; phone?: string; boardId?: string }) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
  status: 'idle',
  profile: null,
  error: null,

  clearProfile: () => set({ status: 'idle', profile: null, error: null }),

  loadProfile: async (userId) => {
    set({ status: 'loading', error: null });
    try {
      const profile = await profileApi.getProfile(userId);
      set({ status: 'loaded', profile, error: null });
    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },

  ensureProfile: async (userId, email, displayName, avatarUrl) => {
    const exists = await profileApi.profileExists(userId);
    if (!exists) {
      const profile = await profileApi.createProfile({
        id: userId,
        fullName: displayName ?? email.split('@')[0],
        email,
        avatarUrl,
      });
      set({ status: 'loaded', profile, error: null });
    } else {
      await get().loadProfile(userId);
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    try {
      const updated = await profileApi.updateProfile(profile.id, updates);
      set({ profile: updated });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  uploadAvatar: async (imageUri) => {
    const { profile } = get();
    if (!profile) return;
    set({ status: 'avatarUploading' });
    try {
      const avatarUrl = await profileApi.uploadAvatar(profile.id, imageUri);
      const updated = await profileApi.updateProfile(profile.id, { avatarUrl });
      set({ status: 'loaded', profile: updated });
    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },
}));
