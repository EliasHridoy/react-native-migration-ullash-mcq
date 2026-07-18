import { create } from 'zustand';
import { LeaderboardEntry, LeaderboardTab } from '../types/leaderboard.types';
import { leaderboardApi } from '../api/leaderboard.api';
import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

interface LeaderboardState {
  activeTab: LeaderboardTab;
  globalEntries: LeaderboardEntry[];
  examEntries: LeaderboardEntry[];
  currentExamId: string | null;
  recentExams: { id: string; title: string; examType: string; startTime: string }[];
  isLoading: boolean;
  isRealtimeConnected: boolean;
  error: string | null;
}

interface LeaderboardActions {
  setTab: (tab: LeaderboardTab) => void;
  loadGlobal: () => Promise<void>;
  loadExam: (examId: string) => Promise<void>;
  loadRecentExams: () => Promise<void>;
  subscribeToRealtime: () => () => void;
}

export const useLeaderboardStore = create<LeaderboardState & LeaderboardActions>((set, get) => ({
  activeTab: 'global',
  globalEntries: [],
  examEntries: [],
  currentExamId: null,
  recentExams: [],
  isLoading: false,
  isRealtimeConnected: false,
  error: null,

  setTab: (tab) => {
    set({ activeTab: tab });
    if (tab === 'global') {
      get().loadGlobal();
    } else {
      const { recentExams, currentExamId } = get();
      if (recentExams.length === 0) {
        get().loadRecentExams().then(() => {
          const updatedExamId = get().currentExamId || get().recentExams[0]?.id;
          if (updatedExamId) {
            get().loadExam(updatedExamId);
          }
        });
      } else {
        const updatedExamId = currentExamId || recentExams[0]?.id;
        if (updatedExamId) {
          get().loadExam(updatedExamId);
        }
      }
    }
  },

  loadGlobal: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await leaderboardApi.getGlobalLeaderboard();
      set({ globalEntries: entries, isLoading: false });
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to load global leaderboard', isLoading: false });
    }
  },

  loadExam: async (examId) => {
    set({ isLoading: true, currentExamId: examId, error: null });
    try {
      const entries = await leaderboardApi.getExamLeaderboard(examId);
      set({ examEntries: entries, isLoading: false });
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to load exam leaderboard', isLoading: false });
    }
  },

  loadRecentExams: async () => {
    set({ isLoading: true, error: null });
    try {
      const exams = await leaderboardApi.getRecentExams();
      set({ recentExams: exams, isLoading: false });
      if (exams.length > 0 && !get().currentExamId) {
        set({ currentExamId: exams[0].id });
      }
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to load recent exams', isLoading: false });
    }
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: SupabaseConstants.leaderboardSnapshotsTable,
      }, () => {
        const { activeTab, currentExamId } = get();
        if (activeTab === 'global') {
          get().loadGlobal();
        } else if (currentExamId) {
          get().loadExam(currentExamId);
        }
      })
      .subscribe((status) => {
        set({ isRealtimeConnected: status === 'SUBSCRIBED' });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
