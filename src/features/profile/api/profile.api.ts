import { supabase } from '@/core/supabase/client';
import { UserProfile } from '../types/profile.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { ProfileUpdate } from '@/core/supabase/types';

function mapRowToProfile(row: Record<string, any>): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    email: row.email ?? '',
    phone: row.phone_number,
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
    const payload: ProfileUpdate = { updated_at: new Date().toISOString() };
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phone !== undefined) payload.phone_number = updates.phone;
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
