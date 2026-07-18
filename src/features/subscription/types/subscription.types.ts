export type SubscriptionStatus = 'free' | 'active' | 'grace' | 'expired';

export interface EntitlementStatus {
  subscriptionStatus: SubscriptionStatus;
  hasPremiumAccess: boolean;
  isInGracePeriod: boolean;
  gracePeriodEndsAt?: string;
  entitlementExpiresAt?: string;
}

export interface SubscriptionPackage {
  id: string;
  title: string;
  period: 'monthly' | 'annual';
  priceDisplay: string;
  priceAmount: number;
}
