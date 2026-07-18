# 06 — Profile Feature (Agent 6)

> **Agent:** Agent 6  
> **Prerequisite:** Agent 5 (Auth) complete  
> **Flutter Source:** `src/lib/features/profile/`  
> **Output:** Profile screen, edit screen, avatar upload, auto-create on first login

---

## 📋 Tasks

- [ ] Create `UserProfile` TypeScript interface
- [ ] Create `profileApi.ts` (Supabase CRUD)
- [ ] Create `useProfileStore` (Zustand)
- [ ] Auto-create profile on first login
- [ ] Build Profile screen
- [ ] Build Edit Profile screen
- [ ] Implement avatar upload via Supabase Storage

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `UserProfile` entity | `UserProfile` interface |
| `ProfileRemoteDataSource` | `profileApi.ts` |
| `ProfileNotifier` | `useProfileStore` (Zustand) |
| `ProfileState` sealed | `ProfileStatus` union type |
| `profile_screen.dart` | `app/(app)/profile/index.tsx` |
| `edit_profile_screen.dart` | `app/(app)/profile/edit.tsx` |
| `image_picker` | `expo-image-picker` |
| Supabase Storage `profile-avatars` | Same bucket — unchanged |

---

## 🛠️ Implementation

### Step 1: Profile Types

**`src/features/profile/types/profile.types.ts`**
```typescript
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  boardId?: string;
  subscriptionStatus: 'free' | 'active' | 'grace' | 'expired';
  subscriptionTier: string;
  revenuecatCustomerId?: string;
  entitlementExpiresAt?: string;
  gracePeriodEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'avatarUploading';
```

---

### Step 2: Profile API

**`src/features/profile/api/profile.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { UserProfile } from '../types/profile.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

function mapRowToProfile(row: Record<string, any>): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    email: row.email ?? '',
    phone: row.phone,
    avatarUrl: row.avatar_url,
    boardId: row.board_id,
    subscriptionStatus: row.subscription_status ?? 'free',
    subscriptionTier: row.subscription_tier ?? 'free',
    revenuecatCustomerId: row.revenuecat_customer_id,
    entitlementExpiresAt: row.entitlement_expires_at,
    gracePeriodEndsAt: row.grace_period_ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const profileApi = {
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from(SupabaseConstants.profilesTable)
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return mapRowToProfile(data);
  },

  async profileExists(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from(SupabaseConstants.profilesTable)
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    return data != null;
  },

  async createProfile(profile: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    const { data, error } = await supabase
      .from(SupabaseConstants.profilesTable)
      .upsert({
        id: profile.id,
        full_name: profile.fullName,
        email: profile.email,
        avatar_url: profile.avatarUrl,
        subscription_status: 'free',
        subscription_tier: 'free',
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return mapRowToProfile(data);
  },

  async updateProfile(userId: string, updates: {
    fullName?: string;
    phone?: string;
    boardId?: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.boardId !== undefined) payload.board_id = updates.boardId;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

    const { data, error } = await supabase
      .from(SupabaseConstants.profilesTable)
      .update(payload)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return mapRowToProfile(data);
  },

  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    const filename = `${userId}/${Date.now()}_avatar.jpg`;
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage
      .from(SupabaseConstants.profileAvatarsBucket)
      .upload(filename, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(SupabaseConstants.profileAvatarsBucket)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  },
};
```

---

### Step 3: Profile Store

**`src/features/profile/store/profile.store.ts`**
```typescript
import { create } from 'zustand';
import { UserProfile, ProfileStatus } from '../types/profile.types';
import { profileApi } from '../api/profile.api';
import { useAuthStore } from '@/features/auth/store/auth.store';

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
    const updated = await profileApi.updateProfile(profile.id, updates);
    set({ profile: updated });
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
```

---

### Step 4: Profile Screen

**`app/(app)/profile/index.tsx`**
```tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProfileStore } from '@/features/profile/store/profile.store';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { profile, loadProfile, uploadAvatar, status } = useProfileStore();

  useEffect(() => {
    if (user?.id) loadProfile(user.id);
  }, [user?.id]);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Avatar */}
      <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {profile?.fullName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        {status === 'avatarUploading' && (
          <View style={styles.avatarOverlay}>
            <Text style={{ color: Colors.white }}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Profile Card */}
      <GlassCard style={styles.card}>
        <Text style={styles.name}>{profile?.fullName ?? '—'}</Text>
        <Text style={styles.email}>{profile?.email ?? '—'}</Text>
        <Text style={styles.tier}>
          Plan: <Text style={{ color: Colors.primary }}>{profile?.subscriptionTier ?? 'Free'}</Text>
        </Text>
      </GlassCard>

      {/* Actions */}
      <GradientButton
        label="Edit Profile"
        onPress={() => router.push('/(app)/profile/edit')}
        style={{ marginTop: 16 }}
      />
      <GradientButton
        label="Sign Out"
        onPress={handleSignOut}
        variant="danger"
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 24 },
  avatarContainer: { alignSelf: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, color: Colors.white, fontFamily: 'Inter_700Bold' },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 16 },
  name: { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  tier: { fontSize: 13, color: Colors.textMuted },
});
```

---

### Step 5: Auto-Create Profile on First Login

In the auth listener (from Agent 5's `app/_layout.tsx`), add profile auto-creation:

```tsx
// In AuthListener component
const { ensureProfile } = useProfileStore();

// After user is set from session:
if (session?.user) {
  const { user } = session;
  setUser({ ... });
  // Auto-create profile if first login
  await ensureProfile(
    user.id,
    user.email!,
    user.user_metadata?.full_name ?? user.user_metadata?.name,
    user.user_metadata?.avatar_url,
  );
}
```

---

## ✅ Completion Checklist

- [ ] `src/features/profile/types/profile.types.ts` created
- [ ] `src/features/profile/api/profile.api.ts` created
- [ ] `src/features/profile/store/profile.store.ts` created
- [ ] `app/(app)/profile/index.tsx` — Profile screen built
- [ ] `app/(app)/profile/edit.tsx` — Edit screen built (name + phone fields)
- [ ] Avatar upload via `expo-image-picker` + Supabase Storage works
- [ ] Auto-create profile on first login (no duplicate rows)
- [ ] Profile data shows correct subscription tier

---

## 🔗 Next: [07_BOARD_SUBJECT_HIERARCHY.md](./07_BOARD_SUBJECT_HIERARCHY.md)
