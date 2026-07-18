import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/core/theme/colors';
import { Typography } from '@/core/theme/typography';
import { BorderRadius, Shadows } from '@/core/theme/spacing';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'danger';
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function GradientButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const gradients: Record<string, [string, string]> = {
    primary: ['#6C5CE7', '#8B7CF6'],
    accent: ['#00D2D3', '#26E9EA'],
    danger: ['#FF6B6B', '#FF8F8F'],
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      style={[animStyle, style]}
      activeOpacity={1}
    >
      <LinearGradient
        colors={gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, Shadows.button, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabled: { opacity: 0.5 },
  label: {
    ...Typography.labelLarge,
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
});
