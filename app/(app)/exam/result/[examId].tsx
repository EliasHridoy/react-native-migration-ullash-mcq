import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { resultApi } from '@/features/result/api/result.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { TopicResult } from '@/features/result/types/result.types';

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <GlassCard style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

interface ProgressBarProps {
  ratio: number; // 0-1
  color: string;
}

function ProgressBar({ ratio, color }: ProgressBarProps) {
  return (
    <View style={styles.progressBarBg}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

interface TopicRowProps {
  topic: TopicResult;
}

function TopicRow({ topic }: TopicRowProps) {
  const isWeak = topic.accuracy < 0.6;
  const barColor = isWeak ? Colors.error : Colors.success;

  return (
    <GlassCard style={styles.topicCard}>
      <View style={styles.topicHeaderRow}>
        <Text style={styles.topicName} numberOfLines={2}>
          {topic.topicName}
        </Text>
        <Text style={[styles.topicAccuracy, { color: barColor }]}>
          {(topic.accuracy * 100).toFixed(0)}%
        </Text>
      </View>
      <ProgressBar ratio={topic.accuracy} color={barColor} />
      <Text style={styles.topicStats}>
        ✓ {topic.correct}{'  '}✗ {topic.incorrect}{'  '}—{' '}
        {topic.unanswered}
      </Text>
    </GlassCard>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ResultAnalysisScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const {
    data: result,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['exam-result', examId, user?.id],
    queryFn: () => resultApi.getResult(examId, user!.id),
    enabled: !!examId && !!user?.id,
  });

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading results…</Text>
      </SafeAreaView>
    );
  }

  // ── Error / empty state ────────────────────────────────────────────────────
  if (isError || !result) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Could not load results.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalQuestions =
    result.correctCount + result.incorrectCount + result.unansweredCount;
  const accuracy = totalQuestions > 0 ? result.correctCount / totalQuestions : 0;
  const accuracyColor = accuracy >= 0.6 ? Colors.success : Colors.error;

  const weakTopics = result.topicResults.filter((t) => t.accuracy < 0.6);
  const strongTopics = result.topicResults.filter((t) => t.accuracy >= 0.6);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Text style={styles.pageTitle}>Exam Results</Text>

        {/* ── Score Card ──────────────────────────────────────────────────── */}
        <GlassCard style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text style={styles.scoreValue}>{result.score.toFixed(2)}</Text>
          <View style={styles.rankRow}>
            <Text style={styles.rankText}>Rank #{result.rank}</Text>
            <Text style={styles.rankTotal}>of {result.totalParticipants}</Text>
          </View>
        </GlassCard>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard label="Correct" value={result.correctCount} color={Colors.success} />
          <StatCard label="Wrong" value={result.incorrectCount} color={Colors.error} />
          <StatCard label="Skipped" value={result.unansweredCount} color={Colors.textMuted} />
        </View>

        {/* ── Accuracy ────────────────────────────────────────────────────── */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Overall Accuracy</Text>
          <ProgressBar ratio={accuracy} color={accuracyColor} />
          <Text style={[styles.accuracyValue, { color: accuracyColor }]}>
            {(accuracy * 100).toFixed(1)}%
          </Text>
        </GlassCard>

        {/* ── Time Taken ──────────────────────────────────────────────────── */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.timeTakenRow}>
            <Text style={styles.sectionTitle}>Time Taken</Text>
            <Text style={styles.timeValue}>
              {Math.floor(result.timeTakenSeconds / 60)}m{' '}
              {result.timeTakenSeconds % 60}s
            </Text>
          </View>
        </GlassCard>

        {/* ── Topic Analysis ──────────────────────────────────────────────── */}
        {result.topicResults.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Topic Analysis</Text>

            {/* Weak topics (accuracy < 60%) highlighted first */}
            {weakTopics.length > 0 && (
              <>
                <View style={styles.weaknessHeader}>
                  <Text style={styles.weaknessIcon}>⚠️</Text>
                  <Text style={styles.weaknessLabel}>Needs Improvement</Text>
                </View>
                {weakTopics.map((topic) => (
                  <TopicRow key={topic.topicId} topic={topic} />
                ))}
              </>
            )}

            {/* Strong topics */}
            {strongTopics.length > 0 && (
              <>
                <View style={styles.weaknessHeader}>
                  <Text style={styles.weaknessIcon}>✅</Text>
                  <Text style={[styles.weaknessLabel, { color: Colors.success }]}>
                    Strong Areas
                  </Text>
                </View>
                {strongTopics.map((topic) => (
                  <TopicRow key={topic.topicId} topic={topic} />
                ))}
              </>
            )}
          </>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.replace('/home' as never)}
          style={styles.primaryBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/home/records' as never)}
          style={styles.secondaryBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>View All Records</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
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

  // ── Page header
  pageTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 20,
  },

  // ── Score card
  scoreCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 28,
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: 52,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    marginTop: 4,
  },
  rankRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'baseline',
  },
  rankText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  rankTotal: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },

  // ── Stats row
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // ── Progress bar
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },

  // ── Section cards
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  accuracyValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 6,
  },
  timeTakenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },

  // ── Topic analysis
  sectionHeading: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  weaknessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  weaknessIcon: {
    fontSize: 14,
  },
  weaknessLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.error,
  },
  topicCard: {
    marginBottom: 10,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  topicName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    flex: 1,
  },
  topicAccuracy: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  topicStats: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 8,
  },

  // ── Action buttons
  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  backBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
