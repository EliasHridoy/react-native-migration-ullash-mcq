# 12 — Scoring Engine & Results (Agent 12)

> **Agent:** Agent 12  
> **Prerequisite:** Agent 11 complete  
> **Flutter Source:** `src/lib/features/result/`, `src/lib/core/utils/app_utils.dart`  
> **Output:** Result analysis screen, records/history screen, weakness vector display

---

## 📋 Tasks

- [ ] Create `ExamResult` and `TopicResult` TypeScript types
- [ ] Create `resultApi.ts` (Supabase result fetching)
- [ ] Build Result Analysis screen
- [ ] Build Records/History screen
- [ ] Display weakness vector (topic-by-topic breakdown)

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `ExamResult` entity | `ExamResult` interface |
| `TopicResult` entity | `TopicResult` interface |
| `ResultRemoteDataSource` | `resultApi.ts` |
| `result_analysis_screen.dart` | `app/(app)/exam/result/[examId].tsx` |
| `records_screen.dart` | `app/(app)/home/records.tsx` |
| Scoring utils | `src/core/utils/scoring.utils.ts` (Agent 3) |

---

## 🛠️ Implementation

### Step 1: Result Types

**`src/features/result/types/result.types.ts`**
```typescript
export interface TopicResult {
  topicId: string;
  topicName: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number; // 0-1
}

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  score: number;
  finalRankValue: number;
  rank: number;
  totalParticipants: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  topicResults: TopicResult[];
  submittedAt: string;
}

export interface ExamRecord {
  examId: string;
  examTitle: string;
  score: number;
  rank: number;
  totalParticipants: number;
  submittedAt: string;
}
```

---

### Step 2: Result API

**`src/features/result/api/result.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { ExamResult, ExamRecord } from '../types/result.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const resultApi = {
  async getResult(examId: string, userId: string): Promise<ExamResult> {
    const { data, error } = await supabase
      .from(SupabaseConstants.userExamResultsTable)
      .select('*, exams(title, duration_minutes)')
      .eq('exam_id', examId)
      .eq('user_id', userId)
      .single();
    if (error) throw error;

    const topicResults = (data.topic_results ?? []).map((t: any) => ({
      topicId: t.topic_id,
      topicName: t.topic_name,
      correct: t.correct,
      incorrect: t.incorrect,
      unanswered: t.unanswered,
      accuracy: (t.correct + t.incorrect) > 0 ? t.correct / (t.correct + t.incorrect) : 0,
    }));

    return {
      id: data.id,
      examId: data.exam_id,
      userId: data.user_id,
      score: data.score,
      finalRankValue: data.final_rank_value,
      rank: data.rank,
      totalParticipants: data.total_participants,
      correctCount: data.correct_count,
      incorrectCount: data.incorrect_count,
      unansweredCount: data.unanswered_count,
      timeTakenSeconds: data.time_taken_seconds,
      topicResults,
      submittedAt: data.submitted_at,
    };
  },

  async getHistory(userId: string, page = 0, pageSize = 20): Promise<ExamRecord[]> {
    const from = page * pageSize;
    const { data, error } = await supabase
      .from(SupabaseConstants.userExamResultsTable)
      .select('exam_id, score, rank, total_participants, submitted_at, exams(title)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;

    return data.map((row: any) => ({
      examId: row.exam_id,
      examTitle: row.exams?.title ?? 'Unknown Exam',
      score: row.score,
      rank: row.rank,
      totalParticipants: row.total_participants,
      submittedAt: row.submitted_at,
    }));
  },
};
```

---

### Step 3: Result Analysis Screen

**`app/(app)/exam/result/[examId].tsx`**
```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { resultApi } from '@/features/result/api/result.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';

export default function ResultAnalysisScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: result, isLoading } = useQuery({
    queryKey: ['exam-result', examId, user?.id],
    queryFn: () => resultApi.getResult(examId, user!.id),
    enabled: !!examId && !!user?.id,
  });

  if (isLoading) return <Text style={{ color: Colors.textPrimary }}>Loading results...</Text>;
  if (!result) return null;

  const totalQuestions = result.correctCount + result.incorrectCount + result.unansweredCount;
  const accuracy = totalQuestions > 0 ? result.correctCount / totalQuestions : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <Text style={styles.title}>Exam Results</Text>

      {/* Score Card */}
      <GlassCard style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Your Score</Text>
        <Text style={styles.score}>{result.score.toFixed(2)}</Text>
        <View style={styles.rankRow}>
          <Text style={styles.rankText}>Rank #{result.rank}</Text>
          <Text style={styles.rankTotal}>of {result.totalParticipants}</Text>
        </View>
      </GlassCard>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Correct" value={result.correctCount} color={Colors.success} />
        <StatCard label="Wrong" value={result.incorrectCount} color={Colors.error} />
        <StatCard label="Skipped" value={result.unansweredCount} color={Colors.textMuted} />
      </View>

      {/* Accuracy */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Accuracy</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${accuracy * 100}%`, backgroundColor: accuracy >= 0.6 ? Colors.success : Colors.error }]} />
        </View>
        <Text style={{ color: Colors.textSecondary, marginTop: 4 }}>{(accuracy * 100).toFixed(1)}%</Text>
      </GlassCard>

      {/* Topic Breakdown */}
      <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Topic Analysis</Text>
      {result.topicResults.map(topic => (
        <GlassCard key={topic.topicId} style={{ marginBottom: 10 }}>
          <View style={styles.topicRow}>
            <Text style={styles.topicName}>{topic.topicName}</Text>
            <Text style={{ color: topic.accuracy >= 0.6 ? Colors.success : Colors.error }}>
              {(topic.accuracy * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${topic.accuracy * 100}%`,
              backgroundColor: topic.accuracy >= 0.6 ? Colors.success : Colors.error,
            }]} />
          </View>
          <Text style={styles.topicStats}>
            ✓ {topic.correct}  ✗ {topic.incorrect}  — {topic.unanswered}
          </Text>
        </GlassCard>
      ))}

      {/* Action Buttons */}
      <TouchableOpacity onPress={() => router.replace('/(app)/home')} style={styles.backBtn}>
        <Text style={styles.backBtnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard style={{ flex: 1, alignItems: 'center', marginHorizontal: 4 }}>
      <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 20 },
  scoreCard: { alignItems: 'center', marginBottom: 16, paddingVertical: 24 },
  scoreLabel: { fontSize: 14, color: Colors.textSecondary },
  score: { fontSize: 48, fontFamily: 'Inter_700Bold', color: Colors.primary, marginTop: 4 },
  rankRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'baseline' },
  rankText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.accent },
  rankTotal: { fontSize: 13, color: Colors.textMuted },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  progressBarBg: { height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: 8, borderRadius: 4 },
  topicRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  topicName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, flex: 1 },
  topicStats: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  backBtn: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  backBtnText: { color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
```

---

### Step 4: Records / History Screen

**`app/(app)/home/records.tsx`**
```tsx
// Build with useInfiniteQuery for pagination
// Show list of ExamRecord cards with: exam title, score, rank, date
// Tap → navigate to result/[examId]
import { useInfiniteQuery } from '@tanstack/react-query';
import { resultApi } from '@/features/result/api/result.api';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function RecordsScreen() {
  const { user } = useAuthStore();

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['exam-history', user?.id],
    queryFn: ({ pageParam = 0 }) => resultApi.getHistory(user!.id, pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.length === 20 ? pages.length : undefined,
    enabled: !!user?.id,
  });

  const records = data?.pages.flat() ?? [];
  // Render as FlatList with pagination via onEndReached → fetchNextPage
}
```

---

## ✅ Completion Checklist

- [ ] `ExamResult`, `TopicResult`, `ExamRecord` types created
- [ ] `resultApi.ts` — `getResult` and `getHistory` implemented
- [ ] Result Analysis screen with score card, stats row, topic breakdown
- [ ] Weakness topics highlighted in red (accuracy < 60%)
- [ ] Records/History screen with infinite scroll
- [ ] Tap on record → navigates to result detail
- [ ] `scoring.utils.ts` functions tested with sample data

---

## 🔗 Next: [13_LEADERBOARD.md](./13_LEADERBOARD.md)
