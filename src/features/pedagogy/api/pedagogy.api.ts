import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export interface WeaknessGap {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  accuracy: number;
  totalAttempted: number;
  totalCorrect: number;
  isRemediated: boolean;
}

export interface MicroPractice {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  gapId: string;
  status: string;
  priority: number;
  questionCount: number;
  score: number | null;
  completedAt: string | null;
}

export interface HeatmapEntry {
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  topicId: string;
  topicName: string;
  accuracy: number;
  totalAttempts: number;
}

export const pedagogyApi = {
  /**
   * Fetches unresolved weakness gaps for a user, joining with topics → chapters → subjects
   * to get human-readable names for the hierarchy.
   */
  async getWeaknessGaps(userId: string): Promise<WeaknessGap[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.userWeaknessGapsTable)
      .select(`
        *,
        topics!inner(
          name,
          chapter_id,
          chapters!inner(
            name,
            subject_id,
            subjects!inner(name)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_remediated', false)
      .order('accuracy', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => {
      const topic = row.topics as Record<string, unknown>;
      const chapter = topic.chapters as Record<string, unknown>;
      const subject = chapter.subjects as Record<string, unknown>;

      return {
        id: row.id,
        userId: row.user_id,
        topicId: row.topic_id,
        topicName: (topic.name as string) ?? '',
        chapterId: (chapter.id ?? topic.chapter_id) as string,
        chapterName: (chapter.name as string) ?? '',
        subjectId: (subject.id ?? chapter.subject_id) as string,
        subjectName: (subject.name as string) ?? '',
        accuracy: row.accuracy,
        totalAttempted: row.total_attempted,
        totalCorrect: row.total_correct,
        isRemediated: row.is_remediated,
      };
    });
  },

  /**
   * Fetches pending (not completed) micro-practice sessions, joining topics for names.
   */
  async getPendingMicroPractices(userId: string): Promise<MicroPractice[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.microPracticeQueueTable)
      .select(`
        *,
        topics!inner(name)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data ?? []).map((row) => {
      const topic = row.topics as Record<string, unknown>;
      return {
        id: row.id,
        userId: row.user_id,
        topicId: row.topic_id,
        topicName: (topic.name as string) ?? '',
        gapId: row.gap_id,
        status: row.status,
        priority: row.priority,
        questionCount: row.question_count,
        score: row.score,
        completedAt: row.completed_at,
      };
    });
  },

  /**
   * Calls the `get_weakness_heatmap` RPC for aggregated heatmap data.
   */
  async getWeaknessHeatmap(userId: string): Promise<HeatmapEntry[]> {
    const { data, error } = await supabase.rpc(
      SupabaseConstants.rpcGetWeaknessHeatmap,
      { p_user_id: userId }
    );
    if (error) throw error;

    // RPC returns Json — safely cast through unknown
    const rows = (data ?? []) as unknown as HeatmapEntry[];
    return rows;
  },

  /**
   * Marks a micro-practice session as completed.
   */
  async markMicroPracticeComplete(practiceId: string, score: number): Promise<void> {
    const { error } = await supabase
      .from(SupabaseConstants.microPracticeQueueTable)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        score,
      })
      .eq('id', practiceId);
    if (error) throw error;
  },
};
