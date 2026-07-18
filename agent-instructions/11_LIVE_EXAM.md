# 11 — Live Exam + Real-Time Engine (Agent 11)

> **Agent:** Agent 11  
> **Prerequisite:** Agents 7, 8, 10 complete  
> **Flutter Source:** `src/lib/features/exam/` (live exam portion)  
> **Output:** Live exam screen, clock sync, anti-cheat submission, WebSocket realtime, back-navigation guard

---

## 📋 Tasks

- [ ] Create `liveExamApi.ts` (RPC calls: clock sync, enter exam, submit)
- [ ] Create `useLiveExamStore` (Zustand state machine)
- [ ] Implement 3-sample median clock sync
- [ ] Implement deterministic question order with session persistence
- [ ] Build Live Exam screen with countdown timer
- [ ] Implement Supabase Realtime subscription (exam status changes)
- [ ] Implement 20-second debounced auto-save of answers
- [ ] Implement back-navigation guard (Android back button)
- [ ] Wire server-authoritative SECURITY DEFINER RPC submission

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `LiveExamNotifier` | `useLiveExamStore` (Zustand) |
| `LiveExamState` sealed | `LiveExamStatus` union type |
| `SyncClock` use case | `clockSync()` function |
| `EnterLiveExam` use case | `enterLiveExam()` in store |
| `SubmitLiveExam` use case | `submitExam()` in store |
| `LiveExamRealtimeDataSource` | Supabase Realtime channel subscription |
| `PopScope` (Flutter) | `useBackHandler` (react-native-back-handler) |
| `live_exam_screen.dart` | `app/(app)/exam/live/[examId].tsx` |

---

## 🛠️ Implementation

### Step 1: Types

**`src/features/exam/types/live-exam.types.ts`**
```typescript
export type LiveExamStatus =
  | 'syncing'       // Syncing clock
  | 'loading'       // Fetching questions
  | 'active'        // Exam in progress
  | 'submitting'    // Submitting answers
  | 'submitted'     // Successfully submitted
  | 'expired'       // Exam time ended
  | 'error';        // Error state

export interface LiveExamSession {
  examId: string;
  userId: string;
  questionOrder: string[];   // Ordered question IDs
  selectedAnswers: Record<string, string>; // questionId → optionId
  submitted: boolean;
  submittedAt?: string;
  clientOffset: number;      // ms offset between client and server
}

export interface LiveExam {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed';
  durationMinutes: number;
}
```

---

### Step 2: Clock Sync (3-sample Median)

**`src/features/exam/utils/clock-sync.utils.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

/**
 * 3-sample median clock sync to filter network jitter.
 * Mirrors: sync_clock.dart
 */
export async function syncClock(): Promise<number> {
  const offsets: number[] = [];

  for (let i = 0; i < 3; i++) {
    const clientBefore = Date.now();
    const { data, error } = await supabase.rpc(SupabaseConstants.rpcGetServerTime);
    const clientAfter = Date.now();

    if (error) throw error;

    const serverTime = new Date(data).getTime();
    const rtt = clientAfter - clientBefore;
    const offset = serverTime + rtt / 2 - clientAfter;
    offsets.push(offset);
  }

  // Return median
  const sorted = [...offsets].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function getServerTime(clientOffset: number): number {
  return Date.now() + clientOffset;
}
```

---

### Step 3: Live Exam API

**`src/features/exam/api/live-exam.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';
import { LiveExam, LiveExamSession } from '../types/live-exam.types';
import { Question } from '../types/question.types';
import { seededShuffle, shuffleExamQuestions, createExamSeed } from '../utils/shuffle.utils';

export const liveExamApi = {
  async getExam(examId: string): Promise<LiveExam> {
    const { data, error } = await supabase
      .from(SupabaseConstants.examsTable)
      .select('*')
      .eq('id', examId)
      .single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status,
      durationMinutes: data.duration_minutes,
    };
  },

  async getExamQuestions(examId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.examQuestionListTable)
      .select(`*, questions(*, options(*))`)
      .eq('exam_id', examId)
      .order('display_order');
    if (error) throw error;
    return data.map((row: any) => ({
      id: row.questions.id,
      text: row.questions.text,
      explanation: row.questions.explanation,
      difficultyLevel: row.questions.difficulty_level,
      options: (row.questions.options ?? []).map((o: any) => ({
        id: o.id,
        questionId: o.question_id,
        optionText: o.option_text,
        isCorrect: o.is_correct,
        serialNo: o.serial_no,
      })),
    }));
  },

  async getOrCreateSession(examId: string, userId: string, questionOrder: string[]): Promise<LiveExamSession> {
    // Try to get existing session (for reconnect safety)
    const { data: existing } = await supabase
      .from(SupabaseConstants.userExamSessionsTable)
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return {
        examId: existing.exam_id,
        userId: existing.user_id,
        questionOrder: existing.question_order,
        selectedAnswers: existing.selected_answers ?? {},
        submitted: existing.submitted,
        submittedAt: existing.submitted_at,
        clientOffset: 0,
      };
    }

    // Create new session
    const { data, error } = await supabase
      .from(SupabaseConstants.userExamSessionsTable)
      .insert({
        exam_id: examId,
        user_id: userId,
        question_order: questionOrder,
        selected_answers: {},
        submitted: false,
      })
      .select()
      .single();
    if (error) throw error;

    return {
      examId: data.exam_id,
      userId: data.user_id,
      questionOrder: data.question_order,
      selectedAnswers: {},
      submitted: false,
      clientOffset: 0,
    };
  },

  async saveAnswers(examId: string, userId: string, answers: Record<string, string>): Promise<void> {
    await supabase
      .from(SupabaseConstants.userExamSessionsTable)
      .update({ selected_answers: answers })
      .eq('exam_id', examId)
      .eq('user_id', userId);
  },

  async submitExam(examId: string, userId: string, answers: Record<string, string>, clientOffset: number): Promise<void> {
    // Server-authoritative SECURITY DEFINER RPC — validates timing and scores
    const { error } = await supabase.rpc(SupabaseConstants.rpcSubmitExamSession, {
      p_exam_id: examId,
      p_user_id: userId,
      p_selected_answers: answers,
      p_client_offset_ms: clientOffset,
    });
    if (error) throw error;
  },
};
```

---

### Step 4: Live Exam Store (State Machine)

**`src/features/exam/store/live-exam.store.ts`**
```typescript
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
        const { remainingSeconds, session: s, status } = get();
        if (status !== 'active') { clearInterval(countdownInterval!); return; }
        if (remainingSeconds <= 0) {
          clearInterval(countdownInterval!);
          get().submitExam(); // Auto-submit on expiry
          return;
        }
        set({ remainingSeconds: remainingSeconds - 1, showTimeWarning: remainingSeconds <= 300 });
      }, 1000);

      // 8. Subscribe to Supabase Realtime for exam status changes
      supabase
        .channel(`exam-status-${examId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'exams',
          filter: `id=eq.${examId}`,
        }, (payload) => {
          if (payload.new.status === 'completed') {
            get().submitExam();
          }
        })
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
      if (s) liveExamApi.saveAnswers(s.examId, s.userId, s.selectedAnswers);
    }, 20_000);
  },

  submitExam: async () => {
    const { session, status } = get();
    if (!session || status === 'submitting' || status === 'submitted') return;

    set({ status: 'submitting' });
    if (countdownInterval) clearInterval(countdownInterval);
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    try {
      await liveExamApi.submitExam(
        session.examId,
        session.userId,
        session.selectedAnswers,
        session.clientOffset,
      );
      set({ status: 'submitted' });
    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },

  goToQuestion: (index) => set({ currentIndex: index }),

  reset: () => {
    if (countdownInterval) clearInterval(countdownInterval);
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    supabase.removeAllChannels();
    set({
      status: 'syncing', exam: null, questions: [], session: null,
      currentIndex: 0, remainingSeconds: 0, error: null,
    });
  },
}));
```

---

### Step 5: Live Exam Screen

**`app/(app)/exam/live/[examId].tsx`**

Key features to implement (follow `live_exam_screen.dart` for exact UI):

```tsx
import { useEffect, useRef } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useLiveExamStore } from '@/features/exam/store/live-exam.store';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function LiveExamScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const store = useLiveExamStore();

  useEffect(() => {
    store.enterExam(examId, userId);
    return () => store.reset();
  }, [examId]);

  // Android back button guard
  useEffect(() => {
    const backAction = () => {
      if (store.status === 'active') {
        Alert.alert('Exit Exam?', 'Your progress will be lost.', [
          { text: 'Stay', style: 'cancel' },
          { text: 'Exit & Submit', style: 'destructive', onPress: store.submitExam },
        ]);
        return true; // Prevent default back
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, [store.status]);

  // After submission → navigate to results
  useEffect(() => {
    if (store.status === 'submitted') {
      router.replace({ pathname: '/(app)/exam/result/[examId]', params: { examId } });
    }
  }, [store.status]);

  // Render States:
  // 'syncing' → spinner + "Synchronizing clock..."
  // 'loading' → shimmer cards
  // 'active'  → exam UI (see below)
  // 'submitting' → overlay spinner
  // 'expired' → "Time's up!" screen
  // 'error'   → error with retry

  // ACTIVE UI REQUIREMENTS:
  // 1. Header: Countdown timer (pulses red < 5 min), progress "Q 3/25"
  // 2. Realtime connection indicator dot
  // 3. Question card (GlassCard) with option buttons
  // 4. Options: tap to select (no immediate feedback — submit to server first)
  // 5. Bottom nav: Prev | Grid | Next | Submit
  // 6. "Get Hint" button: ALWAYS DISABLED in live exam (show "Hints disabled in Live Exam")
  // 7. Question grid modal (color: answered=primary, current=accent, unanswered=surface)
}
```

**Timer Display:**
```tsx
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
```

---

## ✅ Completion Checklist

- [ ] `clock-sync.utils.ts` — 3-sample median sync
- [ ] `live-exam.api.ts` — all RPC calls
- [ ] `live-exam.store.ts` — full state machine
- [ ] Live Exam screen with all 6 status states
- [ ] Countdown timer with pulse animation < 5 minutes
- [ ] Android back-navigation guard (Alert dialog)
- [ ] 20-second debounced auto-save
- [ ] Supabase Realtime postgres_changes listener on `exams.status`
- [ ] Server-authoritative submission via `submit_exam_session` RPC
- [ ] Hint button disabled with informative message
- [ ] Navigation to results screen after submission

---

## 🔗 Next: [12_SCORING_AND_RESULTS.md](./12_SCORING_AND_RESULTS.md)
