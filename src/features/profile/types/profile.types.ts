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
