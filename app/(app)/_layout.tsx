import { Tabs } from 'expo-router';
import { Colors } from '@/core/theme/colors';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: 'Home', tabBarIcon: () => null }} />
      <Tabs.Screen name="leaderboard/index" options={{ title: 'Rank', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile', tabBarIcon: () => null }} />
      <Tabs.Screen name="question-search" options={{ href: null }} />
    </Tabs>
  );
}
