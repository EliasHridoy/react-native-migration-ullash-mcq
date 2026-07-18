process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';

const mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Stack: () => null,
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
}));

// Mock Expo Blur
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...props }) => {
      const React = require('react');
      return React.createElement(View, props, children);
    },
  };
});

// Mock Expo Linear Gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => {
      const React = require('react');
      return React.createElement(View, props, children);
    },
  };
});

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
