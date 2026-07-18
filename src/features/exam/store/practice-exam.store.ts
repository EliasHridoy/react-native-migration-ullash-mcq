import { create } from 'zustand';
import { Question } from '../types/question.types';
import { questionApi } from '../api/question.api';
import { questionStatusApi } from '../api/question-status.api';
import { shuffleExamQuestions, createExamSeed } from '../utils/shuffle.utils';

export type QuestionAnswerState = 'unanswered' | 'correct' | 'incorrect';

export interface AnsweredQuestion {
  questionId: string;
  selectedOptionId: string | null;
  state: QuestionAnswerState;
}

export interface PracticeExamSessionState {
  status: 'idle' | 'loading' | 'active' | 'completed' | 'error';
  questions: Question[];
  currentIndex: number;
  answers: Record<string, AnsweredQuestion>;
  completedCount: number;
  error: string | null;
}

interface PracticeExamActions {
  loadSession: (params: { mode: string; topicId?: string; chapterId?: string; subjectId?: string }, userId: string) => Promise<void>;
  selectAnswer: (questionId: string, optionId: string, userId: string) => Promise<void>;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const usePracticeExamStore = create<PracticeExamSessionState & PracticeExamActions>((set, get) => ({
  status: 'idle',
  questions: [],
  currentIndex: 0,
  answers: {},
  completedCount: 0,
  error: null,

  loadSession: async (params, userId) => {
    set({ status: 'loading', error: null });
    try {
      let rawQuestions: Question[] = [];

      if (params.mode === 'byTopic' && params.topicId) {
        rawQuestions = await questionApi.getQuestionsByTopic(params.topicId);
      } else if (params.mode === 'byChapter' && params.chapterId) {
        rawQuestions = await questionApi.getQuestionsByChapter(params.chapterId);
      } else if (params.mode === 'bySubject' && params.subjectId) {
        rawQuestions = await questionApi.getQuestionsBySubject(params.subjectId);
      } else {
        throw new Error('Invalid practice exam parameters or missing selection ID');
      }

      if (rawQuestions.length === 0) {
        throw new Error('No questions found for this selection');
      }

      const sessionId = Object.values(params).filter(Boolean).join('-');
      const seed = createExamSeed(userId, sessionId);
      const shuffled = shuffleExamQuestions(rawQuestions, seed);

      // Pre-load completed status for these questions
      const completedIds = await questionStatusApi.getCompletedIds(
        userId,
        shuffled.map(q => q.id)
      );
      const completedCount = completedIds.length;

      set({ status: 'active', questions: shuffled, currentIndex: 0, answers: {}, completedCount });
    } catch (e: any) {
      set({ status: 'error', error: e.message || 'Failed to load practice session' });
    }
  },

  selectAnswer: async (questionId, optionId, userId) => {
    const { questions, answers } = get();
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const selectedOption = question.options.find(o => o.id === optionId);
    const isCorrect = selectedOption?.isCorrect ?? false;

    const newAnswer: AnsweredQuestion = {
      questionId,
      selectedOptionId: optionId,
      state: isCorrect ? 'correct' : 'incorrect',
    };

    set({ answers: { ...answers, [questionId]: newAnswer } });

    try {
      // Update question_status table
      if (isCorrect) {
        await questionStatusApi.markComplete(userId, questionId);
      } else {
        await questionStatusApi.markIncomplete(userId, questionId);
      }
    } catch (err) {
      console.error('Error saving question status:', err);
    }

    // Update completed count (representing correct questions answered in this session)
    const correctCount = Object.values({ ...answers, [questionId]: newAnswer })
      .filter(a => a.state === 'correct').length;
    set({ completedCount: correctCount });
  },

  goToQuestion: (index) => set({ currentIndex: index }),
  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) set({ currentIndex: currentIndex + 1 });
  },
  previousQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },
  completeSession: () => set({ status: 'completed' }),
  resetSession: () => set({ status: 'idle', questions: [], currentIndex: 0, answers: {}, completedCount: 0, error: null }),
}));
