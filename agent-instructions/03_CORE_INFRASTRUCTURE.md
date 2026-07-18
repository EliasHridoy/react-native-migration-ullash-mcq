# 03 — Core Infrastructure (Agent 3)

> **Agent:** Agent 3  
> **Prerequisite:** Agent 1 & 2 complete  
> **Output:** Supabase client, constants, navigation structure, error handling, scoring utilities

---

## 📋 Tasks

- [ ] Create Supabase client singleton
- [ ] Create `app.constants.ts` (mirrors `AppConstants`)
- [ ] Create `supabase.constants.ts` (table names, buckets, function slugs)
- [ ] Create scoring utilities (mirrors `app_utils.dart`)
- [ ] Create auth-aware navigation structure with Expo Router
- [ ] Create base error types
- [ ] Create `useSupabaseAuth` session persistence hook

---

## 🛠️ Implementation

### Step 1: Supabase Client

**`src/core/supabase/client.ts`**
```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // important for React Native
  },
});
```

Install polyfill:
```bash
npm install react-native-url-polyfill
```

---

### Step 2: App Constants

**`src/core/constants/app.constants.ts`**
```typescript
// Mirrors: src/lib/core/constants/app_constants.dart

export const AppConstants = {
  // App Info
  appName: 'Ullash Live MCQ',
  packageName: 'com.livemcq.live_exam',

  // Supabase (read from env)
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,

  // Exam Rules
  defaultPenaltyFactor: 0.25,      // Wrong answer deduction
  submissionGraceWindowSecs: 30,   // 30s after exam end
  clockSyncSampleCount: 3,         // 3-sample median for clock sync

  // Question Status
  completedThreshold: 0.6,         // 60% correct = mastered

  // Pedagogy
  weaknessThreshold: 0.6,          // Below 60% → weakness gap
  microPracticeMinQuestions: 5,

  // AI Tutor
  maxHintsPerQuestion: 3,          // Free hint limit per question
  hintRateLimitMinutes: 5,
  semanticSimilarityThreshold: 0.35,

  // bKash Payments
  bkashAmountMonthly: 99.00,       // BDT
  bkashAmountAnnual: 799.00,       // BDT
  bkashIpnAmountTolerance: 0.01,   // 1 paisa tolerance

  // RevenueCat
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  premiumEntitlementId: 'premium',

  // Subscription
  gracePeriodDays: 3,
} as const;
```

---

### Step 3: Supabase Constants

**`src/core/constants/supabase.constants.ts`**
```typescript
// Mirrors: src/lib/core/constants/supabase_constants.dart

export const SupabaseConstants = {
  // Tables
  profilesTable: 'profiles',
  boardsTable: 'boards',
  subjectsTable: 'subjects',
  chaptersTable: 'chapters',
  topicsTable: 'topics',
  questionsTable: 'questions',
  optionsTable: 'options',
  questionHierarchyMapTable: 'question_hierarchy_map',
  questionOriginMapTable: 'question_origin_map',
  examsTable: 'exams',
  examQuestionListTable: 'exam_question_list',
  userExamResultsTable: 'user_exam_results',
  userExamSessionsTable: 'user_exam_sessions',
  questionStatusTable: 'question_status',
  leaderboardSnapshotsTable: 'leaderboard_snapshots',
  studyMaterialsTable: 'study_materials',
  materialTopicMapTable: 'material_topic_map',
  hintUsageTable: 'hint_usage',
  subscriptionEventsTable: 'subscription_events',
  bkashTransactionsTable: 'bkash_transactions',
  userWeaknessGapsTable: 'user_weakness_gaps',
  microPracticeQueueTable: 'micro_practice_queue',

  // Storage Buckets
  profileAvatarsBucket: 'profile-avatars',
  studyMaterialsBucket: 'study-materials',

  // Realtime Channels
  examChannel: (examId: string) => `exam:${examId}`,

  // Realtime Events
  examStartedEvent: 'exam_started',
  examEndedEvent: 'exam_ended',
  examTimeWarningEvent: 'time_warning',

  // Edge Function Slugs
  generateHintFunction: 'generate-hint',
  semanticSearchFunction: 'semantic-search',
  embedMaterialFunction: 'embed-material',
  revenuecatWebhookFunction: 'revenuecat-webhook',
  bkashPaymentFunction: 'bkash-payment',

  // RPCs
  rpcGetServerTime: 'get_server_time',
  rpcSubmitExamSession: 'submit_exam_session',
  rpcGetEntitlementStatus: 'get_entitlement_status',
  rpcUpsertSubscription: 'upsert_subscription',
  rpcUpsertBkashPayment: 'upsert_bkash_payment',
  rpcGetBkashTransactions: 'get_bkash_transactions',
  rpcSemanticSearchMaterials: 'semantic_search_materials',
  rpcGetWeaknessHeatmap: 'get_weakness_heatmap',
} as const;
```

---

### Step 4: Scoring Utilities

**`src/core/utils/scoring.utils.ts`**
```typescript
// Mirrors: src/lib/core/utils/app_utils.dart

export interface ScoringParams {
  correctAnswers: number;
  wrongAnswers: number;
  penaltyFactor?: number;
}

export interface FinalRankParams extends ScoringParams {
  timeTakenSeconds: number;
  totalTimeSeconds: number;
}

export interface TopicResult {
  topicId: string;
  topicName: string;
  correct: number;
  incorrect: number;
  unanswered: number;
}

/**
 * Calculates the base exam score.
 * Score = Correct - (Wrong × PenaltyFactor)
 */
export function calculateScore({
  correctAnswers,
  wrongAnswers,
  penaltyFactor = 0.25,
}: ScoringParams): number {
  return correctAnswers - wrongAnswers * penaltyFactor;
}

/**
 * Calculates the final rank value including tie-breaker.
 * FinalRankValue = Score + (1 - TimeTaken / TotalTime)
 */
export function calculateFinalRankValue({
  correctAnswers,
  wrongAnswers,
  penaltyFactor = 0.25,
  timeTakenSeconds,
  totalTimeSeconds,
}: FinalRankParams): number {
  const score = calculateScore({ correctAnswers, wrongAnswers, penaltyFactor });

  if (totalTimeSeconds <= 0) return score;

  const timeFraction = Math.min(1, timeTakenSeconds / totalTimeSeconds);
  const tieBreakerBonus = 1 - timeFraction;

  return score + tieBreakerBonus;
}

/**
 * Generates a weakness vector from topic results.
 * Returns topics where accuracy is below the 60% threshold.
 */
export function generateWeaknessVector(
  topicResults: TopicResult[],
  threshold = 0.6,
): TopicResult[] {
  return topicResults.filter((topic) => {
    const total = topic.correct + topic.incorrect;
    if (total === 0) return false;
    const accuracy = topic.correct / total;
    return accuracy < threshold;
  });
}
```

---

### Step 5: Auth-Aware Navigation

**`app/index.tsx`** (Splash / Redirect)
```tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/core/supabase/client';
import { Colors } from '@/core/theme/colors';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/home');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}
```

**`app/(auth)/_layout.tsx`**
```tsx
import { Stack } from 'expo-router';
import { Colors } from '@/core/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
```

**`app/(app)/_layout.tsx`** (Tab Navigator)
```tsx
import { Tabs } from 'expo-router';
import { Colors } from '@/core/theme/colors';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: 'Home', tabBarIcon: () => null }} />
      <Tabs.Screen name="leaderboard/index" options={{ title: 'Rank', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile', tabBarIcon: () => null }} />
    </Tabs>
  );
}
```

---

### Step 6: Base Error Types

**`src/core/errors/failures.ts`**
```typescript
// Mirrors: src/lib/core/errors/failures.dart

export class AppFailure {
  constructor(public readonly message: string) {}
}

export class ServerFailure extends AppFailure {}
export class NetworkFailure extends AppFailure {}
export class AuthFailure extends AppFailure {}
export class NotFoundFailure extends AppFailure {}
export class ValidationFailure extends AppFailure {}
export class PaymentFailure extends AppFailure {}
export class UnauthorizedFailure extends AppFailure {}

export function isFailure(value: unknown): value is AppFailure {
  return value instanceof AppFailure;
}
```

---

### Step 7: Session Persistence Hook

**`src/features/auth/hooks/useSession.ts`**
```typescript
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/core/supabase/client';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading, userId: session?.user?.id ?? null };
}
```

---

## ✅ Completion Checklist

- [ ] `src/core/supabase/client.ts` created and connects to Supabase
- [ ] `src/core/constants/app.constants.ts` created
- [ ] `src/core/constants/supabase.constants.ts` created
- [ ] `src/core/utils/scoring.utils.ts` created (with tests)
- [ ] `src/core/errors/failures.ts` created
- [ ] `src/features/auth/hooks/useSession.ts` created
- [ ] `app/index.tsx` (splash) redirects based on session
- [ ] `app/(auth)/_layout.tsx` created
- [ ] `app/(app)/_layout.tsx` tab navigator created
- [ ] `supabase.auth.getSession()` returns session in test device

---

## 🔗 Next: [04_DATABASE_MIGRATION.md](./04_DATABASE_MIGRATION.md)
