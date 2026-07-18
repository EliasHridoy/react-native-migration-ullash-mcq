import { supabase } from '@/core/supabase/client';
import { LeaderboardEntry } from '../types/leaderboard.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const leaderboardApi = {
  async getGlobalLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.leaderboardSnapshotsTable)
      .select('*, profiles(full_name, avatar_url)')
      .is('exam_id', null)
      .order('rank', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return (data ?? []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        rank: row.rank,
        userId: row.user_id,
        displayName: profile?.full_name ?? 'Anonymous',
        avatarUrl: profile?.avatar_url ?? undefined,
        score: row.score,
        finalRankValue: row.final_rank_value,
      };
    });
  },

  async getExamLeaderboard(examId: string, limit = 100): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.leaderboardSnapshotsTable)
      .select('*, profiles(full_name, avatar_url)')
      .eq('exam_id', examId)
      .order('rank', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return (data ?? []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        rank: row.rank,
        userId: row.user_id,
        displayName: profile?.full_name ?? 'Anonymous',
        avatarUrl: profile?.avatar_url ?? undefined,
        score: row.score,
        finalRankValue: row.final_rank_value,
        examId,
      };
    });
  },

  async getRecentExams(limit = 10): Promise<{ id: string; title: string; examType: string; startTime: string }[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.examsTable)
      .select('id, title, exam_type, start_time')
      .order('start_time', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title ?? 'Mock Exam',
      examType: row.exam_type ?? 'live',
      startTime: row.start_time,
    }));
  },
};
