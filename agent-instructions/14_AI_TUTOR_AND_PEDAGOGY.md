# 14 — AI Tutor "Mitro" & Ogroshor Pedagogical Loop (Agent 14)

> **Agent:** Agent 14  
> **Prerequisite:** Agents 8, 10 complete  
> **Flutter Source:** `src/lib/features/ai_tutor/`, `src/lib/features/pedagogy/`  
> **Output:** Hint button, hint sheet, AI semantic search screen, weakness heatmap, micro-practice screen

---

## 📋 Tasks

### AI Mitro (5.2.x)
- [ ] Create `aiTutorApi.ts` (Edge Function invocation)
- [ ] Build `HintButton` component (disabled in Live Exam)
- [ ] Build `HintSheet` bottom sheet with progressive hints
- [ ] Build AI Search screen (`app/(app)/ai-search.tsx`)

### Ogroshor Loop (5.1.x)
- [ ] Create `pedagogyApi.ts` (weakness gaps, micro-practice queue)
- [ ] Create `usePedagogyStore` (Zustand)
- [ ] Build `WeaknessHeatmapWidget` (accordion tree: Subject→Chapter→Topic)
- [ ] Build `PendingPracticesWidget` (horizontal scroll carousel)
- [ ] Build Micro-Practice screen (`app/(app)/micro-practice.tsx`)
- [ ] Integrate both widgets into Home Dashboard

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `HintButton` widget | `HintButton` component |
| `HintSheet` widget | `BottomSheet` via `@gorhom/bottom-sheet` |
| `HintNotifier` | `useHintStore` (Zustand) |
| `ai_search_screen.dart` | `app/(app)/ai-search.tsx` |
| `WeaknessHeatmapWidget` | `WeaknessHeatmap` component |
| `PendingPracticesWidget` | `PendingPractices` component |
| `micro_practice_screen.dart` | `app/(app)/micro-practice.tsx` |

---

## 🛠️ Implementation

### Step 1: AI Tutor API

**`src/features/ai_tutor/api/ai-tutor.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';
import { AppConstants } from '@/core/constants/app.constants';

export interface HintRequest {
  questionId: string;
  questionText: string;
  userSelectedOptionText?: string;
  hintDepth: 1 | 2 | 3; // Progressive depth
}

export interface HintResponse {
  hint: string;
  hintDepth: number;
  hintsRemaining: number;
}

export interface SemanticSearchResult {
  materialId: string;
  title: string;
  excerpt: string;
  similarity: number;
  materialType: string;
}

export const aiTutorApi = {
  async getHint(request: HintRequest): Promise<HintResponse> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.generateHintFunction,
      {
        body: {
          question_id: request.questionId,
          question_text: request.questionText,
          user_selection: request.userSelectedOptionText,
          hint_depth: request.hintDepth,
        },
      }
    );
    if (error) throw error;
    return {
      hint: data.hint,
      hintDepth: data.hint_depth,
      hintsRemaining: data.hints_remaining,
    };
  },

  async semanticSearch(query: string): Promise<SemanticSearchResult[]> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.semanticSearchFunction,
      { body: { query } }
    );
    if (error) throw error;
    return (data.results ?? []).map((r: any) => ({
      materialId: r.id,
      title: r.title,
      excerpt: r.excerpt,
      similarity: r.similarity,
      materialType: r.material_type,
    }));
  },

  async checkHintUsage(questionId: string, userId: string): Promise<number> {
    const { data } = await supabase
      .from(SupabaseConstants.hintUsageTable)
      .select('hint_count')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .maybeSingle();
    return data?.hint_count ?? 0;
  },
};
```

---

### Step 2: Hint Button Component

Install bottom sheet:
```bash
npm install @gorhom/bottom-sheet
npx expo install react-native-reanimated react-native-gesture-handler
```

**`src/components/HintButton.tsx`**
```tsx
import React, { useCallback, useRef, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Colors } from '@/core/theme/colors';
import { aiTutorApi, HintResponse } from '@/features/ai_tutor/api/ai-tutor.api';
import { AppConstants } from '@/core/constants/app.constants';

interface HintButtonProps {
  questionId: string;
  questionText: string;
  selectedOptionText?: string;
  disabled?: boolean; // true in Live Exam
  userId: string;
}

export function HintButton({ questionId, questionText, selectedOptionText, disabled, userId }: HintButtonProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const openSheet = () => bottomSheetRef.current?.expand();

  const getNextHint = async () => {
    if (hintsUsed >= AppConstants.maxHintsPerQuestion) return;
    setLoading(true);
    try {
      const response = await aiTutorApi.getHint({
        questionId,
        questionText,
        userSelectedOptionText: selectedOptionText,
        hintDepth: (hintsUsed + 1) as 1 | 2 | 3,
      });
      setHints(prev => [...prev, response]);
      setHintsUsed(prev => prev + 1);
    } catch (e) {
      console.error('Hint error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <TouchableOpacity style={[styles.btn, styles.disabledBtn]} disabled>
        <Text style={styles.disabledText}>💡 Hints disabled in Live Exam</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={() => { openSheet(); if (hints.length === 0) getNextHint(); }}>
        <Text style={styles.btnText}>💡 Get Hint ({AppConstants.maxHintsPerQuestion - hintsUsed} left)</Text>
      </TouchableOpacity>

      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['50%', '80%']} backgroundStyle={{ backgroundColor: Colors.surface }}>
        <BottomSheetView style={styles.sheet}>
          <Text style={styles.sheetTitle}>AI Mitro — Socratic Hints</Text>
          <Text style={styles.sheetSubtitle}>Hints guide you conceptually without revealing the answer</Text>

          {hints.map((h, i) => (
            <View key={i} style={styles.hintCard}>
              <Text style={styles.hintDepth}>Hint {h.hintDepth}</Text>
              <Text style={styles.hintText}>{h.hint}</Text>
            </View>
          ))}

          {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />}

          {!loading && hintsUsed < AppConstants.maxHintsPerQuestion && (
            <TouchableOpacity style={styles.nextHintBtn} onPress={getNextHint}>
              <Text style={styles.nextHintText}>Get Deeper Hint →</Text>
            </TouchableOpacity>
          )}
          {hintsUsed >= AppConstants.maxHintsPerQuestion && (
            <Text style={styles.limitText}>Maximum hints reached for this question.</Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(108,92,231,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.primary, fontFamily: 'Inter_500Medium', fontSize: 13 },
  disabledBtn: { backgroundColor: 'rgba(107,111,138,0.1)', borderColor: 'transparent' },
  disabledText: { color: Colors.textMuted, fontSize: 12 },
  sheet: { padding: 20, flex: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  hintCard: { backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14, marginBottom: 12 },
  hintDepth: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold', marginBottom: 6, textTransform: 'uppercase' },
  hintText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  nextHintBtn: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.primary, marginTop: 8 },
  nextHintText: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  limitText: { color: Colors.textMuted, textAlign: 'center', marginTop: 8, fontSize: 13 },
});
```

---

### Step 3: Pedagogy API

**`src/features/pedagogy/api/pedagogy.api.ts`**
```typescript
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
  priority: number;
  resolved: boolean;
}

export interface MicroPractice {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  scheduledAt: string;
  completed: boolean;
}

export const pedagogyApi = {
  async getWeaknessGaps(userId: string): Promise<WeaknessGap[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.userWeaknessGapsTable)
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('priority', { ascending: false });
    if (error) throw error;
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      topicId: row.topic_id,
      topicName: row.topic_name,
      chapterId: row.chapter_id,
      chapterName: row.chapter_name,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      accuracy: row.accuracy,
      priority: row.priority,
      resolved: row.resolved,
    }));
  },

  async getPendingMicroPractices(userId: string): Promise<MicroPractice[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.microPracticeQueueTable)
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('scheduled_at', { ascending: true })
      .limit(10);
    if (error) throw error;
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      topicId: row.topic_id,
      topicName: row.topic_name,
      scheduledAt: row.scheduled_at,
      completed: row.completed,
    }));
  },

  async getWeaknessHeatmap(userId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc(
      SupabaseConstants.rpcGetWeaknessHeatmap,
      { p_user_id: userId }
    );
    if (error) throw error;
    return data ?? [];
  },
};
```

---

### Step 4: Home Dashboard Integration

Add these widgets to `app/(app)/home/index.tsx`:

```tsx
// In HomeScreen, after the Live Exam banner section:
import { PendingPracticesWidget } from '@/features/pedagogy/components/PendingPracticesWidget';
import { WeaknessHeatmapWidget } from '@/features/pedagogy/components/WeaknessHeatmapWidget';

// Usage:
<PendingPracticesWidget userId={user.id} />
<WeaknessHeatmapWidget userId={user.id} />
```

**`src/features/pedagogy/components/PendingPracticesWidget.tsx`**
- Horizontal `FlatList` of `GlassCard` items showing pending topics
- Each card: topic name, accuracy%, "Practice Now" button
- Taps navigate to `micro-practice` screen

**`src/features/pedagogy/components/WeaknessHeatmapWidget.tsx`**
- Accordion list: Subject → expand → Chapters → expand → Topics
- Each topic shows accuracy % bar (red < 40%, orange 40-59%)
- "Breathing glow" animation for severe weaknesses using `react-native-reanimated`

---

### Step 5: AI Search Screen

**`app/(app)/ai-search.tsx`**
```tsx
// Similar to question-search but uses Edge Function semantic search
// Key elements:
// 1. TextInput with "Search study materials..."
// 2. Suggestion chips: "Newton's law", "Bangladesh Constitution 7th amendment"
// 3. Skeleton loaders during search
// 4. Result cards: title, excerpt, similarity %, material type icon
// 5. Tap → open material via expo-linking or navigate to study materials
```

---

### Step 6: Micro-Practice Screen

**`app/(app)/micro-practice.tsx`**
- Takes `topicId` as param
- Loads questions for that topic (same as Practice Exam)
- Shows MCQ player with immediate feedback
- On session complete → marks micro-practice as complete in DB
- Uses `easeOut` animation for correct/incorrect feedback

---

## ✅ Completion Checklist

**AI Mitro:**
- [ ] `aiTutorApi.ts` — hint + semantic search Edge Function calls
- [ ] `HintButton` component — enabled in Practice, disabled in Live
- [ ] `HintSheet` bottom sheet with progressive 3-depth hints
- [ ] AI Search screen with skeleton loaders and result cards

**Ogroshor Loop:**
- [ ] `pedagogyApi.ts` — gaps, micro-practice queue, heatmap RPC
- [ ] `PendingPracticesWidget` — horizontal scroll carousel on dashboard
- [ ] `WeaknessHeatmapWidget` — accordion Subject→Chapter→Topic tree
- [ ] Micro-Practice screen with completion tracking
- [ ] Both widgets integrated into Home Dashboard

---

## 🔗 Next: [15_SUBSCRIPTION_AND_PAYWALL.md](./15_SUBSCRIPTION_AND_PAYWALL.md)
