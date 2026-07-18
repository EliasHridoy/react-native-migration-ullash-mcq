# 08 — Question Bank & Smart Search (Agent 8)

> **Agent:** Agent 8  
> **Prerequisite:** Agents 1–4, 7 complete  
> **Flutter Source:** `src/lib/features/exam/` (Question Bank portion)  
> **Output:** Question types, question API, smart search screen, question status tracking

---

## 📋 Tasks

- [ ] Create `Question`, `Option`, `QuestionHierarchyMap`, `QuestionOriginMap` types
- [ ] Create `questionApi.ts` with all query modes
- [ ] Create `questionStatusApi.ts` for practice progress tracking
- [ ] Build Smart Search screen with 500ms debounce
- [ ] Implement question status tracking (UNIQUE upsert)

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `Question` entity | `Question` + `Option` interfaces |
| `QuestionRemoteDataSourceImpl` | `questionApi.ts` |
| `QuestionSearchNotifier` | `useQuestionSearch` hook (debounced) |
| `question_search_screen.dart` | `app/(app)/question-search.tsx` |
| `QuestionStatusDataSource` | `questionStatusApi.ts` |
| GIN index `.textSearch()` | Supabase `.textSearch()` — same API |

---

## 🛠️ Implementation

### Step 1: Question Types

**`src/features/exam/types/question.types.ts`**
```typescript
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type PracticeExamMode = 'byTopic' | 'byChapter' | 'bySubject' | 'byOrigin';

export interface Option {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  serialNo: number;
}

export interface Question {
  id: string;
  text: string;
  explanation?: string;
  difficultyLevel: DifficultyLevel;
  options: Option[];
  // Hierarchy (from join)
  hierarchyMap?: QuestionHierarchyMap;
  originMap?: QuestionOriginMap;
}

export interface QuestionHierarchyMap {
  questionId: string;
  topicId: string;
  chapterId: string;
  subjectId: string;
}

export interface QuestionOriginMap {
  questionId: string;
  boardId: string;
  examYear: number;
  examType: string;
}

export interface QuestionStatus {
  questionId: string;
  userId: string;
  isCompleted: boolean;
}

export interface PracticeExamParams {
  mode: PracticeExamMode;
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  boardId?: string;
  examYear?: number;
}
```

---

### Step 2: Question API

**`src/features/exam/api/question.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { Question, Option } from '../types/question.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

function parseOptions(raw: any[]): Option[] {
  return (raw ?? []).map(o => ({
    id: o.id,
    questionId: o.question_id,
    optionText: o.option_text,
    isCorrect: o.is_correct,
    serialNo: o.serial_no,
  }));
}

function parseQuestion(row: any): Question {
  return {
    id: row.id,
    text: row.text,
    explanation: row.explanation,
    difficultyLevel: row.difficulty_level,
    options: parseOptions(row.options ?? []),
  };
}

export const questionApi = {
  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_hierarchy_map!inner(*)`)
      .eq('question_hierarchy_map.topic_id', topicId);
    if (error) throw error;
    return data.map(parseQuestion);
  },

  async getQuestionsByChapter(chapterId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_hierarchy_map!inner(*)`)
      .eq('question_hierarchy_map.chapter_id', chapterId);
    if (error) throw error;
    return data.map(parseQuestion);
  },

  async getQuestionsBySubject(subjectId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_hierarchy_map!inner(*)`)
      .eq('question_hierarchy_map.subject_id', subjectId);
    if (error) throw error;
    return data.map(parseQuestion);
  },

  async getQuestionsByOrigin(boardId: string, year: number): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_origin_map!inner(*)`)
      .eq('question_origin_map.board_id', boardId)
      .eq('question_origin_map.exam_year', year);
    if (error) throw error;
    return data.map(parseQuestion);
  },

  async searchQuestions(query: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*)`)
      .textSearch('text', query, { config: 'english' })
      .limit(20);
    if (error) throw error;
    return data.map(parseQuestion);
  },
};
```

---

### Step 3: Question Status API

**`src/features/exam/api/question-status.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const questionStatusApi = {
  async getCompletedIds(userId: string, questionIds: string[]): Promise<string[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionStatusTable)
      .select('question_id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('question_id', questionIds);
    if (error) throw error;
    return data.map(r => r.question_id);
  },

  async markComplete(userId: string, questionId: string): Promise<void> {
    // UPSERT — uses UNIQUE(question_id, user_id) constraint
    const { error } = await supabase
      .from(SupabaseConstants.questionStatusTable)
      .upsert({ question_id: questionId, user_id: userId, is_completed: true }, { onConflict: 'question_id,user_id' });
    if (error) throw error;
  },

  async markIncomplete(userId: string, questionId: string): Promise<void> {
    const { error } = await supabase
      .from(SupabaseConstants.questionStatusTable)
      .upsert({ question_id: questionId, user_id: userId, is_completed: false }, { onConflict: 'question_id,user_id' });
    if (error) throw error;
  },

  async getCompletedCount(userId: string, topicId?: string, chapterId?: string, subjectId?: string): Promise<number> {
    let query = supabase
      .from(SupabaseConstants.questionStatusTable)
      .select('question_id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_completed', true);

    // Join with hierarchy map for scoped counts
    // Note: Use Supabase RPC for complex counts if needed

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },
};
```

---

### Step 4: Smart Search Hook (500ms Debounce)

**`src/features/exam/hooks/useQuestionSearch.ts`**
```typescript
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { questionApi } from '../api/question.api';
import { Question } from '../types/question.types';

export function useQuestionSearch() {
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const setQuery = (q: string) => {
    setRawQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(q.trim());
    }, 500);
  };

  const clearSearch = () => {
    setRawQuery('');
    setDebouncedQuery('');
  };

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['question-search', debouncedQuery],
    queryFn: () => questionApi.searchQuestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  return { rawQuery, setQuery, clearSearch, results: results ?? [], isLoading: isLoading && debouncedQuery.length >= 2, isError };
}
```

---

### Step 5: Smart Search Screen

**`app/(app)/question-search.tsx`**
```tsx
import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuestionSearch } from '@/features/exam/hooks/useQuestionSearch';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ShimmerLoader } from '@/components/ShimmerLoader';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';

const SUGGESTION_CHIPS = ["Newton's law", 'photosynthesis', 'quadratic equation', 'Bangladesh Constitution'];

export default function QuestionSearchScreen() {
  const { rawQuery, setQuery, clearSearch, results, isLoading } = useQuestionSearch();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search questions..."
          placeholderTextColor={Colors.textMuted}
          value={rawQuery}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {rawQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
            <Text style={{ color: Colors.textMuted }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestion Chips */}
      {rawQuery.length === 0 && (
        <View style={styles.chips}>
          {SUGGESTION_CHIPS.map(chip => (
            <TouchableOpacity key={chip} style={styles.chip} onPress={() => setQuery(chip)}>
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={{ padding: 16, gap: 12 }}>
          {[1,2,3].map(i => <ShimmerLoader key={i} height={80} borderRadius={12} />)}
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={q => q.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item, index }) => (
          <GlassCard>
            <View style={styles.resultHeader}>
              <Text style={styles.qNum}>#{index + 1}</Text>
              <DifficultyBadge level={item.difficultyLevel} />
            </View>
            <Text style={styles.questionText} numberOfLines={4}>{item.text}</Text>
            {/* Show options with correct highlighted */}
            {item.options.slice(0, 4).map((opt) => (
              <View key={opt.id} style={[styles.option, opt.isCorrect && styles.correctOption]}>
                <Text style={[styles.optionText, opt.isCorrect && styles.correctText]}>
                  {opt.isCorrect ? '✓ ' : ''}{opt.optionText}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}
        ListEmptyComponent={rawQuery.length >= 2 && !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={{ color: Colors.textSecondary }}>No results for "{rawQuery}"</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, height: 48, color: Colors.textPrimary, fontFamily: 'Inter_400Regular', fontSize: 15 },
  clearBtn: { padding: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  chip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  chipText: { color: Colors.primary, fontSize: 13, fontFamily: 'Inter_500Medium' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  qNum: { color: Colors.textMuted, fontSize: 12, fontFamily: 'Inter_500Medium' },
  questionText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  option: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginBottom: 2 },
  optionText: { color: Colors.textSecondary, fontSize: 13 },
  correctOption: { backgroundColor: 'rgba(81,207,102,0.1)' },
  correctText: { color: Colors.success, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', padding: 40 },
});
```

---

## ✅ Completion Checklist

- [ ] `Question`, `Option`, `QuestionHierarchyMap`, `QuestionOriginMap` types created
- [ ] `questionApi.ts` — all 5 query modes implemented
- [ ] `questionStatusApi.ts` — markComplete, markIncomplete with UPSERT
- [ ] `useQuestionSearch` hook with 500ms debounce
- [ ] Smart Search screen with suggestion chips + result cards
- [ ] Correct answers highlighted in search results
- [ ] Stale result guard (discard in-flight results if query changed)

---

## 🔗 Next: [09_STUDY_MATERIALS.md](./09_STUDY_MATERIALS.md)
