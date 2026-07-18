import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/core/theme/colors';
import { BorderRadius, Shadows } from '@/core/theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  noPadding?: boolean;
}

export function GlassCard({ children, style, intensity = 20, noPadding = false }: GlassCardProps) {
  return (
    <View style={[styles.container, Shadows.card, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.border, StyleSheet.absoluteFill]} />
      <View style={noPadding ? undefined : styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.glassFill,
  },
  border: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  content: {
    padding: 16,
  },
});
