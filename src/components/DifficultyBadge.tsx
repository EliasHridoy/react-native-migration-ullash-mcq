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
