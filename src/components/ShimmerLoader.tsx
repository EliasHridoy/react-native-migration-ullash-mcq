import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerLoader({ width = '100%', height = 20, borderRadius = 8, style }: ShimmerProps) {
  const translateX = useSharedValue(-300);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(300, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[{ width: width as number, height, borderRadius, overflow: 'hidden', backgroundColor: '#1A1A2E' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(108,92,231,0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
