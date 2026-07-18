import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';
import { Typography } from '@/core/theme/typography';
import { PendingPracticesWidget } from '@/features/pedagogy/components/PendingPracticesWidget';
import { WeaknessHeatmapWidget } from '@/features/pedagogy/components/WeaknessHeatmapWidget';

import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Home Screen</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userText}>Welcome, {user.displayName || 'User'}!</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <Text style={styles.providerText}>Signed in via {user.provider}</Text>
          </View>
        )}
        <View style={styles.buttonContainer}>
          <GradientButton
            label="Select Board / Start Exam"
            onPress={() => router.push('/(app)/exam/board-selection' as any)}
            style={{ ...styles.button, marginBottom: 12 }}
          />
          <GradientButton
            label="Sign Out"
            onPress={signOut}
            style={styles.button}
          />
        </View>

        {/* Pedagogy Widgets — Ogroshor Loop */}
        {user && (
          <>
            <PendingPracticesWidget userId={user.id} />
            <WeaknessHeatmapWidget userId={user.id} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingBottom: 80,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  userText: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  emailText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  providerText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    maxWidth: 300,
  },
});
