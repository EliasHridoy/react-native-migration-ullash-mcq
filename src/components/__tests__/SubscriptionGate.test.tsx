import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SubscriptionGate } from '../SubscriptionGate';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock auth store
jest.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
}));

// Mock subscription store
const mockUseSubscriptionStore = jest.fn();
jest.mock('@/features/subscription/store/subscription.store', () => ({
  useSubscriptionStore: () => mockUseSubscriptionStore(),
  hasPremiumAccess: ({ status }: { status: string }) => status === 'completed', // simplify logic for testing
}));

describe('SubscriptionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when premium access is active', () => {
    mockUseSubscriptionStore.mockReturnValue({
      status: 'completed',
      entitlement: { id: 'sub-id', status: 'active' },
      checkEntitlement: jest.fn(),
    });

    const { getByText } = render(
      <SubscriptionGate featureName="Premium Video">
        <Text>Secret Video Content</Text>
      </SubscriptionGate>
    );

    expect(getByText('Secret Video Content')).toBeDefined();
  });

  it('renders locked UI when no premium access', () => {
    mockUseSubscriptionStore.mockReturnValue({
      status: 'loaded',
      entitlement: null,
      checkEntitlement: jest.fn(),
    });

    const { getByText } = render(
      <SubscriptionGate featureName="Premium Video">
        <Text>Secret Video Content</Text>
      </SubscriptionGate>
    );

    expect(getByText('Premium Video')).toBeDefined();
    expect(getByText('This feature requires a Premium subscription.')).toBeDefined();
  });
});
