# 02 — Design System (Agent 2)

> **Agent:** Agent 2  
> **Prerequisite:** Agent 1 complete (project initialized)  
> **Output:** Theme tokens, shared components, glassmorphic card system

---

## 📋 Tasks

- [ ] Create color palette (matches Flutter `AppTheme`)
- [ ] Create typography system (Inter font)
- [ ] Create spacing/radius/shadow tokens
- [ ] Build `GlassCard` component
- [ ] Build `GradientButton` component
- [ ] Build `ShimmerLoader` skeleton component
- [ ] Build `DifficultyBadge` component
- [ ] Build `ProgressBar` component
- [ ] Build `AppHeader` component

---

## Flutter → React Native Design Mapping

| Flutter | React Native |
|---------|-------------|
| `AppTheme.primary` = `#6C5CE7` | `colors.primary` = `#6C5CE7` |
| `AppTheme.accent` = `#00D2D3` | `colors.accent` = `#00D2D3` |
| `AppTheme.background` = `#0A0A1A` | `colors.background` = `#0A0A1A` |
| `AppTheme.surface` = `#1A1A2E` | `colors.surface` = `#1A1A2E` |
| `AppTheme.error` = `#FF6B6B` | `colors.error` = `#FF6B6B` |
| `AppTheme.warning` = `#FFC107` | `colors.warning` = `#FFC107` |
| `AppTheme.success` = `#51CF66` | `colors.success` = `#51CF66` |

---

## 🛠️ Implementation

### Step 1: Core Theme Constants

**`src/core/theme/colors.ts`**
```typescript
export const Colors = {
  // Primary palette
  primary: '#6C5CE7',
  primaryLight: '#8B7CF6',
  primaryDark: '#5A4CD1',

  // Accent
  accent: '#00D2D3',
  accentLight: '#26E9EA',

  // Backgrounds
  background: '#0A0A1A',
  surface: '#1A1A2E',
  surfaceElevated: '#16213E',
  surfaceHigh: '#0F3460',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B3C8',
  textMuted: '#6B6F8A',
  textDisabled: '#404060',

  // Semantic
  error: '#FF6B6B',
  errorLight: '#FF8F8F',
  warning: '#FFC107',
  success: '#51CF66',
  successDark: '#3DAD52',
  info: '#74B9FF',

  // Borders & Dividers
  border: 'rgba(108, 92, 231, 0.3)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.06)',

  // Glassmorphism
  glassFill: 'rgba(26, 26, 46, 0.7)',
  glassBorder: 'rgba(108, 92, 231, 0.25)',
  glassOverlay: 'rgba(10, 10, 26, 0.4)',

  // bKash brand
  bkash: '#E2136E',

  // Transparent
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
```

**`src/core/theme/typography.ts`**
```typescript
import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  displayLarge: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headlineLarge: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
  },
  headlineMedium: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  headlineSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});
```

**`src/core/theme/spacing.ts`**
```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};
```

---

### Step 2: GlassCard Component

**`src/components/GlassCard.tsx`**
```tsx
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
```

---

### Step 3: GradientButton Component

**`src/components/GradientButton.tsx`**
```tsx
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
```

---

### Step 4: ShimmerLoader Component

**`src/components/ShimmerLoader.tsx`**
```tsx
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
```

---

### Step 5: DifficultyBadge Component

**`src/components/DifficultyBadge.tsx`**
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/core/theme/colors';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Props { level: Difficulty; }

const config = {
  easy: { label: 'Easy', bg: 'rgba(81,207,102,0.15)', text: '#51CF66' },
  medium: { label: 'Medium', bg: 'rgba(255,193,7,0.15)', text: '#FFC107' },
  hard: { label: 'Hard', bg: 'rgba(255,107,107,0.15)', text: '#FF6B6B' },
};

export function DifficultyBadge({ level }: Props) {
  const { label, bg, text } = config[level];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
});
```

---

## ✅ Completion Checklist

- [ ] `src/core/theme/colors.ts` created
- [ ] `src/core/theme/typography.ts` created
- [ ] `src/core/theme/spacing.ts` created
- [ ] `src/components/GlassCard.tsx` created
- [ ] `src/components/GradientButton.tsx` created
- [ ] `src/components/ShimmerLoader.tsx` created
- [ ] `src/components/DifficultyBadge.tsx` created
- [ ] Visual smoke test: render `GlassCard` on a screen with dark background

---

## 🔗 Next: [03_CORE_INFRASTRUCTURE.md](./03_CORE_INFRASTRUCTURE.md)
