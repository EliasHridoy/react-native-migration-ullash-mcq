import { create } from 'zustand';
import { LiveExamStatus, LiveExamSession, LiveExam } from '../types/live-exam.types';
import { Question } from '../types/question.types';
import { liveExamApi } from '../api/live-exam.api';
import { syncClock, getServerTime } from '../utils/clock-sync.utils';
import { shuffleExamQuestions, createExamSeed } from '../utils/shuffle.utils';
import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

interface LiveExamState {
  status: LiveExamStatus;
  exam: LiveExam | null;
  questions: Question[];
  session: LiveExamSession | null;
  currentIndex: number;
  remainingSeconds: number;
  showTimeWarning: boolean;
  isRealtimeConnected: boolean;
  error: string | null;
}

interface LiveExamActions {
  enterExam: (examId: string, userId: string) => Promise<void>;
  selectAnswer: (questionId: string, optionId: string) => void;
  submitExam: () => Promise<void>;
  goToQuestion: (index: number) => void;
  reset: () => void;
}

let countdownInterval: ReturnType<typeof setInterval> | null = null;
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useLiveExamStore = create<LiveExamState & LiveExamActions>((set, get) => ({
  status: 'syncing',
  exam: null,
  questions: [],
  session: null,
  currentIndex: 0,
  remainingSeconds: 0,
  showTimeWarning: false,
  isRealtimeConnected: false,
  error: null,

  enterExam: async (examId, userId) => {
    set({ status: 'syncing' });
    try {
      // 1. Sync clock
      const clientOffset = await syncClock();

      // 2. Load exam metadata
      set({ status: 'loading' });
      const exam = await liveExamApi.getExam(examId);

      // 3. Validate exam is active
      const serverNow = getServerTime(clientOffset);
      const endTime = new Date(exam.endTime).getTime();
      if (serverNow > endTime + 30_000) {
        set({ status: 'expired', exam });
        return;
      }

      // 4. Load questions & deterministic shuffle
      const rawQuestions = await liveExamApi.getExamQuestions(examId);
      const seed = createExamSeed(userId, examId);
      const shuffled = shuffleExamQuestions(rawQuestions, seed);
      const questionOrder = shuffled.map(q => q.id);

      // 5. Get or create session (reconnect-safe)
      const session = await liveExamApi.getOrCreateSession(examId, userId, questionOrder);
      const finalQuestions = session.questionOrder.map(id => shuffled.find(q => q.id === id)!).filter(Boolean);

      // 6. Calculate remaining time
      const remaining = Math.max(0, Math.floor((endTime - serverNow) / 1000));

      set({
        status: 'active',
        exam,
        questions: finalQuestions,
        session: { ...session, clientOffset },
        remainingSeconds: remaining,
        showTimeWarning: remaining < 300,
      });

      // 7. Start countdown
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        const { remainingSeconds, status } = get();
        if (status !== 'active') {
          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
          }
          return;
        }
        if (remainingSeconds <= 0) {
          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
          }
          get().submitExam(); // Auto-submit on expiry
          return;
        }
        set({ remainingSeconds: remainingSeconds - 1, showTimeWarning: remainingSeconds <= 300 });
      }, 1000);

      // 8. Subscribe to Supabase Realtime for exam status changes
      supabase
        .channel(`exam-status-${examId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'exams',
            filter: `id=eq.${examId}`,
          },
          (payload) => {
            if (payload.new.status === 'completed') {
              get().submitExam();
            }
          }
        )
        .subscribe((status) => {
          set({ isRealtimeConnected: status === 'SUBSCRIBED' });
        });

    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },

  selectAnswer: (questionId, optionId) => {
    const { session } = get();
    if (!session) return;

    const newAnswers = { ...session.selectedAnswers, [questionId]: optionId };
    set({ session: { ...session, selectedAnswers: newAnswers } });

    // 20-second debounced auto-save
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      const { session: s } = get();
      if (s) {
        liveExamApi.saveAnswers(s.examId, s.userId, s.selectedAnswers);
      }
    }, 20_000);
  },

  submitExam: async () => {
    const { session, status } = get();
    if (!session || status === 'submitting' || status === 'submitted') return;

    set({ status: 'submitting' });
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }

    try {
      await liveExamApi.submitExam(
        session.id,
        session.selectedAnswers,
      );
      set({ status: 'submitted' });
    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },

  goToQuestion: (index) => set({ currentIndex: index }),

  reset: () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }
    supabase.removeAllChannels();
    set({
      status: 'syncing',
      exam: null,
      questions: [],
      session: null,
      currentIndex: 0,
      remainingSeconds: 0,
      showTimeWarning: false,
      isRealtimeConnected: false,
      error: null,
    });
  },
}));
