import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/core/theme/colors';
import { GlassCard } from '@/components/GlassCard';
import { ShimmerLoader } from '@/components/ShimmerLoader';
import { usePedagogyStore } from '../store/pedagogy.store';
import { MicroPractice } from '../api/pedagogy.api';

interface PendingPracticesWidgetProps {
  userId: string;
}

function PracticeCard({ item }: { item: MicroPractice }) {
  const router = useRouter();

  const accuracy = 0; // Placeholder: will be derived from weakness gaps if available
  const accuracyColor = accuracy < 40 ? Colors.error : accuracy < 60 ? Colors.warning : Colors.success;

  return (
    <GlassCard style={styles.practiceCard}>
      <Text style={styles.topicLabel} numberOfLines={2}>
        {item.topicName}
      </Text>

      <View style={styles.accuracyRow}>
        <View style={styles.accuracyBarTrack}>
          <View
            style={[
              styles.accuracyBarFill,
              {
                width: `${Math.max(accuracy, 5)}%`,
                backgroundColor: accuracyColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.accuracyText, { color: accuracyColor }]}>{accuracy}%</Text>
      </View>

      <TouchableOpacity
        style={styles.practiceBtn}
        onPress={() =>
          router.push({
            pathname: '/(app)/micro-practice',
            params: { topicId: item.topicId, practiceId: item.id },
          } as never)
        }
        activeOpacity={0.7}
      >
        <Text style={styles.practiceBtnText}>Practice Now →</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

export function PendingPracticesWidget({ userId }: PendingPracticesWidgetProps) {
  const { microPractices, loadingPractices, fetchPendingPractices } = usePedagogyStore();
  const router = useRouter();

  useEffect(() => {
    fetchPendingPractices(userId);
  }, [userId, fetchPendingPractices]);

  if (loadingPractices) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>📝 Pending Practice</Text>
        <View style={styles.shimmerRow}>
          <ShimmerLoader width={160} height={140} borderRadius={12} />
          <ShimmerLoader width={160} height={140} borderRadius={12} />
        </View>
      </View>
    );
  }

  if (microPractices.length === 0) {
    return null; // Don't show section if no pending practices
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>📝 Pending Practice</Text>
        <Text style={styles.countBadge}>{microPractices.length}</Text>
      </View>
      <Text style={styles.sectionSubtitle}>Micro-sessions to strengthen weak areas</Text>

      <FlatList
        data={microPractices}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <PracticeCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  shimmerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  practiceCard: {
    width: 165,
    justifyContent: 'space-between',
  },
  topicLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 10,
    lineHeight: 18,
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  accuracyBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  accuracyText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    width: 28,
    textAlign: 'right',
  },
  practiceBtn: {
    backgroundColor: 'rgba(108,92,231,0.15)',
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  practiceBtnText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
