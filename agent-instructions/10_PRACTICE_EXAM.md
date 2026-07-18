# 10 — Practice Exam Engine (Agent 10)

> **Agent:** Agent 10  
> **Prerequisite:** Agents 7, 8 complete  
> **Flutter Source:** `src/lib/features/exam/` (practice portion)  
> **Output:** Practice exam screen, question shuffling, option randomization, progress tracking

---

## 📋 Tasks

- [ ] Create `practiceExamStore` (Zustand) with session isolation
- [ ] Implement question + option shuffling (reproducible with seed)
- [ ] Build Practice Exam screen (glassmorphic cards, progress bar)
- [ ] Build question grid overview modal
- [ ] Track completion status per question (UPSERT)
- [ ] Show answer explanations after selection

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `PracticeExamNotifier` (family) | `usePracticeExamStore` (Zustand, per-session key) |
| `CreatePracticeExam` use case | `createPracticeSession()` util function |
| `PracticeExamState` sealed | `PracticeExamState` union type |
| `practice_exam_screen.dart` | `app/(app)/exam/practice/[params].tsx` |
| `flutter_animate` entry animations | `react-native-reanimated` `FadeInDown` |
| Grid overview modal | `BottomSheet` modal |

---

## 🛠️ Implementation

### Step 1: Session Utilities (Question/Option Shuffling)

**`src/features/exam/utils/shuffle.utils.ts`**
```typescript
/**
 * Deterministic seeded shuffle using mulberry32 PRNG.
 * Same seed → same order, ensures reproducibility on reconnect.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates a deterministic seed from userId + sessionId
 * so the same user always gets the same question order.
 */
export function createExamSeed(userId: string, sessionId: string): number {
  return hashCode(userId + sessionId);
}

/**
 * Shuffles questions and their options (independently seeded per question).
 */
export function shuffleExamQuestions<Q extends { id: string; options: any[] }>(
  questions: Q[],
  seed: number,
): Q[] {
  const shuffledQuestions = seededShuffle(questions, seed);
  return shuffledQuestions.map((q) => ({
    ...q,
    options: seededShuffle(q.options, seed ^ hashCode(q.id)),
  }));
}
```

---

### Step 2: Practice Exam State Store

**`src/features/exam/store/practice-exam.store.ts`**
```typescript
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
      }

      const sessionId = Object.values(params).filter(Boolean).join('-');
      const seed = createExamSeed(userId, sessionId);
      const shuffled = shuffleExamQuestions(rawQuestions, seed);

      // Pre-load completed status
      const completedIds = await questionStatusApi.getCompletedIds(
        userId,
        shuffled.map(q => q.id)
      );
      const completedCount = completedIds.length;

      set({ status: 'active', questions: shuffled, currentIndex: 0, answers: {}, completedCount });
    } catch (e: any) {
      set({ status: 'error', error: e.message });
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

    // Update question_status table
    if (isCorrect) {
      await questionStatusApi.markComplete(userId, questionId);
    } else {
      await questionStatusApi.markIncomplete(userId, questionId);
    }

    // Update completed count
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
}));
```

---

### Step 3: Practice Exam Screen

**`app/(app)/exam/practice/[params].tsx`**

Key UI elements to implement (full code is extensive — follow Flutter `practice_exam_screen.dart` as reference):

```tsx
// Key structure for app/(app)/exam/practice/[params].tsx
import { usePracticeExamStore } from '@/features/exam/store/practice-exam.store';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PracticeExamScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const store = usePracticeExamStore();

  // Load session on mount
  useEffect(() => {
    store.loadSession({ mode: params.mode, topicId: params.topicId }, user?.id ?? '');
  }, []);

  // UI States:
  // - Loading: 3 ShimmerLoader cards
  // - Active: Question card + options + progress bar
  // - Completed: Summary with score, weakness topics
  // - Error: Error card with retry button

  // REQUIRED FEATURES:
  // 1. AppBar with progress chip "Q 3/25" + linear progress bar
  // 2. GlassCard question card with DifficultyBadge
  // 3. Option cards (tap to select → show correct/incorrect highlight)
  // 4. Show explanation AFTER answering (expandable)
  // 5. "Get Hint" button (disabled for now, implemented in Agent 14)
  // 6. Bottom nav: Prev / Question Grid (modal) / Next
  // 7. Question Grid Modal: 5-col grid of circles (color-coded by state)
}
```

**Option card color coding:**
- Unselected: `Colors.surface` border
- Correct: `rgba(81,207,102,0.2)` fill + green border
- Incorrect: `rgba(255,107,107,0.2)` fill + red border + show correct option in green

---

## ✅ Completion Checklist

- [ ] `shuffle.utils.ts` — seeded Fisher-Yates shuffle for questions + options
- [ ] `practice-exam.store.ts` — Zustand store with session isolation
- [ ] Practice Exam screen route `app/(app)/exam/practice/[params].tsx`
- [ ] Question card with `GlassCard`, `DifficultyBadge`
- [ ] Option selection with correct/incorrect color feedback
- [ ] Explanation shown after answering (expandable section)
- [ ] Progress bar + "Q X/Y" chip in header
- [ ] Question grid overview modal
- [ ] `questionStatusApi` UPSERT called on every answer
- [ ] Completed count updates correctly

---

## 🔗 Next: [11_LIVE_EXAM.md](./11_LIVE_EXAM.md)
