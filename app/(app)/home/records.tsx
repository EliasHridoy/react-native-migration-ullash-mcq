import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { resultApi } from '@/features/result/api/result.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { ExamRecord } from '@/features/result/types/result.types';

// ─── Record Card ─────────────────────────────────────────────────────────────

interface RecordCardProps {
  record: ExamRecord;
  onPress: () => void;
}

function RecordCard({ record, onPress }: RecordCardProps) {
  const formattedDate = new Date(record.submittedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = new Date(record.submittedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.recordCard}>
        {/* Exam title */}
        <Text style={styles.examTitle} numberOfLines={2}>
          {record.examTitle}
        </Text>

        {/* Score + rank row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{record.score.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Score</Text>
          </View>

          <View style={styles.dividerV} />

          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: Colors.accent }]}>
              #{record.rank}
            </Text>
            <Text style={styles.metricLabel}>Rank</Text>
          </View>

          <View style={styles.dividerV} />

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{record.totalParticipants}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            📅 {formattedDate} · {formattedTime}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// ─── Records Screen ───────────────────────────────────────────────────────────

export default function RecordsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['exam-history', user?.id],
    queryFn: ({ pageParam = 0 }: { pageParam: number }) =>
      resultApi.getHistory(user!.id, pageParam),
    getNextPageParam: (lastPage: ExamRecord[], allPages: ExamRecord[][]) =>
      lastPage.length === 20 ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!user?.id,
  });

  const records: ExamRecord[] = data?.pages.flat() ?? [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ExamRecord>) => (
      <RecordCard
        record={item}
        onPress={() =>
          router.push({
            pathname: '/exam/result/[examId]' as never,
            params: { examId: item.examId },
          })
        }
      />
    ),
    [router],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No exam records yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete your first exam to see your results here.
        </Text>
      </View>
    );
  }, [isLoading]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading records…</Text>
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Failed to load records.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Records</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Summary badge */}
      {records.length > 0 && (
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>
            {records.length} exam{records.length !== 1 ? 's' : ''} completed
          </Text>
        </View>
      )}

      <FlatList
        data={records}
        keyExtractor={(item) => item.examId}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  errorText: {
    color: Colors.error,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 28,
    color: Colors.primary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 32,
  },

  // ── Summary badge
  summaryBadge: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  summaryText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },

  // ── List
  listContent: {
    padding: 16,
    paddingBottom: 48,
    flexGrow: 1,
  },

  // ── Record card
  recordCard: {
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  dividerV: {
    width: 1,
    height: 32,
    backgroundColor: Colors.divider,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },

  // ── Footer / empty
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // ── Retry
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
