import { supabase } from '@/core/supabase/client';
import { ExamResult, ExamRecord } from '../types/result.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

// ── Internal raw types aligned to real DB schema ──────────────────────────────

type RawTopicResult = {
  topic_id: string;
  topic_name: string;
  correct: number;
  incorrect: number;
  unanswered: number;
};

export const resultApi = {
  /**
   * Fetches a single exam result for a user.
   * DB columns: correct_answers, wrong_answers, skipped_questions, rank (nullable),
   * completed_at, final_rank_value, time_taken_seconds, topic_results (Json).
   * "total_participants" is not stored in user_exam_results; we derive it via
   * a separate count query on leaderboard_snapshots (or default 0 if unavailable).
   */
  async getResult(examId: string, userId: string): Promise<ExamResult> {
    const { data, error } = await supabase
      .from(SupabaseConstants.userExamResultsTable)
      .select('*, exams(title, duration_minutes)')
      .eq('exam_id', examId)
      .eq('user_id', userId)
      .single();
    if (error) throw error;

    // Derive total_participants from leaderboard_snapshots
    const { count: totalParticipants } = await supabase
      .from(SupabaseConstants.leaderboardSnapshotsTable)
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', examId);

    const rawTopics = Array.isArray(data.topic_results) ? (data.topic_results as RawTopicResult[]) : [];
    const topicResults = rawTopics.map((t) => ({
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
      rank: data.rank ?? 0,
      totalParticipants: totalParticipants ?? 0,
      correctCount: data.correct_answers,
      incorrectCount: data.wrong_answers,
      unansweredCount: data.skipped_questions,
      timeTakenSeconds: data.time_taken_seconds,
      topicResults,
      submittedAt: data.completed_at ?? new Date().toISOString(),
    };
  },

  /**
   * Fetches paginated exam history for a user.
   * Ordered by completed_at descending.
   */
  async getHistory(userId: string, page = 0, pageSize = 20): Promise<ExamRecord[]> {
    const from = page * pageSize;
    const { data, error } = await supabase
      .from(SupabaseConstants.userExamResultsTable)
      .select('exam_id, score, rank, completed_at, exams(title)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;

    // Fetch participant counts in one query for all exam_ids in this page
    const examIds = data.map((r) => r.exam_id);
    const participantMap: Record<string, number> = {};
    if (examIds.length > 0) {
      const { data: lbData } = await supabase
        .from(SupabaseConstants.leaderboardSnapshotsTable)
        .select('exam_id')
        .in('exam_id', examIds);
      if (lbData) {
        lbData.forEach((row) => {
          participantMap[row.exam_id] = (participantMap[row.exam_id] ?? 0) + 1;
        });
      }
    }

    return data.map((row) => ({
      examId: row.exam_id,
      examTitle: (row.exams as { title: string } | null)?.title ?? 'Unknown Exam',
      score: row.score,
      rank: row.rank ?? 0,
      totalParticipants: participantMap[row.exam_id] ?? 0,
      submittedAt: row.completed_at ?? new Date().toISOString(),
    }));
  },
};
