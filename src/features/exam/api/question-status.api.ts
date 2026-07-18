import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const questionStatusApi = {
  async getCompletedIds(userId: string, questionIds: string[]): Promise<string[]> {
    if (!questionIds || questionIds.length === 0) return [];
    const { data, error } = await supabase
      .from(SupabaseConstants.questionStatusTable)
      .select('question_id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('question_id', questionIds);
    if (error) throw error;
    return (data || []).map(r => r.question_id);
  },

  async markComplete(userId: string, questionId: string): Promise<void> {
    // UPSERT — uses UNIQUE(question_id, user_id) constraint
    const { error } = await supabase
      .from(SupabaseConstants.questionStatusTable)
      .upsert(
        { question_id: questionId, user_id: userId, is_completed: true },
        { onConflict: 'question_id,user_id' }
      );
    if (error) throw error;
  },

  async markIncomplete(userId: string, questionId: string): Promise<void> {
    const { error } = await supabase
      .from(SupabaseConstants.questionStatusTable)
      .upsert(
        { question_id: questionId, user_id: userId, is_completed: false },
        { onConflict: 'question_id,user_id' }
      );
    if (error) throw error;
  },

  async getCompletedCount(userId: string, topicId?: string, chapterId?: string, subjectId?: string): Promise<number> {
    if (!topicId && !chapterId && !subjectId) {
      const { count, error } = await supabase
        .from(SupabaseConstants.questionStatusTable)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true);
      if (error) throw error;
      return count ?? 0;
    }

    let query = supabase
      .from(SupabaseConstants.questionStatusTable)
      .select('question_id, questions!inner(question_hierarchy_map!inner(*))', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);

    if (topicId) {
      query = query.eq('questions.question_hierarchy_map.topic_id', topicId);
    } else if (chapterId) {
      query = query.eq('questions.question_hierarchy_map.chapter_id', chapterId);
    } else if (subjectId) {
      query = query.eq('questions.question_hierarchy_map.subject_id', subjectId);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },
};
