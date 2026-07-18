# 07 — Board, Subject, Chapter & Topic Hierarchy (Agent 7)

> **Agent:** Agent 7  
> **Prerequisite:** Agents 1–4 complete  
> **Flutter Source:** `src/lib/features/board_selection/`, `src/lib/features/subject/`  
> **Output:** Board selection screen, Subject/Chapter/Topic screens, academic hierarchy navigation

---

## 📋 Tasks

- [ ] Create types for Board, Subject, Chapter, Topic
- [ ] Create API functions for each level
- [ ] Create React Query hooks for data fetching
- [ ] Build Board Selection screen
- [ ] Build Subject Selection screen
- [ ] Build Chapter Selection screen (with nested topics)
- [ ] Wire navigation: Board → Subject → Chapter → PracticeExam/StudyMaterial

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `Board` entity | `Board` interface |
| `BoardRemoteDataSource` | `boardApi.ts` |
| `BoardNotifier` (Riverpod) | `useBoards()` React Query hook |
| `board_selection_screen.dart` | `app/(app)/exam/board-selection.tsx` |
| `subject_selection_screen.dart` | `app/(app)/exam/subject-selection.tsx` |
| `chapter_selection_screen.dart` | `app/(app)/exam/chapter-selection.tsx` |
| `NotifierProvider.family` | `useQuery(key + id)` React Query |

---

## 🛠️ Implementation

### Step 1: Types

**`src/features/board_selection/types/board.types.ts`**
```typescript
export interface Board {
  id: string;
  name: string;
  category: string; // 'SSC', 'HSC', 'BCS', 'Admission', 'Job'
  createdAt: string;
}
```

**`src/features/subject/types/subject.types.ts`**
```typescript
export interface Subject {
  id: string;
  name: string;
  boardId: string;
  createdAt: string;
}

export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  chapterId: string;
  createdAt: string;
}
```

---

### Step 2: API Functions

**`src/features/board_selection/api/board.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { Board } from '../types/board.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const boardApi = {
  async getBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.boardsTable)
      .select('*')
      .order('name');
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      createdAt: row.created_at,
    }));
  },
};
```

**`src/features/subject/api/subject.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { Chapter, Subject, Topic } from '../types/subject.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const subjectApi = {
  async getSubjects(boardId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.subjectsTable)
      .select('*')
      .eq('board_id', boardId)
      .order('name');
    if (error) throw error;
    return data.map(row => ({ id: row.id, name: row.name, boardId: row.board_id, createdAt: row.created_at }));
  },

  async getChapters(subjectId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.chaptersTable)
      .select('*')
      .eq('subject_id', subjectId)
      .order('name');
    if (error) throw error;
    return data.map(row => ({ id: row.id, name: row.name, subjectId: row.subject_id, createdAt: row.created_at }));
  },

  async getTopics(chapterId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.topicsTable)
      .select('*')
      .eq('chapter_id', chapterId)
      .order('name');
    if (error) throw error;
    return data.map(row => ({ id: row.id, name: row.name, chapterId: row.chapter_id, createdAt: row.created_at }));
  },
};
```

---

### Step 3: React Query Hooks

**`src/features/board_selection/hooks/useBoards.ts`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { boardApi } from '../api/board.api';

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: boardApi.getBoards,
    staleTime: 1000 * 60 * 60, // 1 hour — boards rarely change
  });
}
```

**`src/features/subject/hooks/useSubjectHierarchy.ts`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { subjectApi } from '../api/subject.api';

export function useSubjects(boardId: string | undefined) {
  return useQuery({
    queryKey: ['subjects', boardId],
    queryFn: () => subjectApi.getSubjects(boardId!),
    enabled: !!boardId,
  });
}

export function useChapters(subjectId: string | undefined) {
  return useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: () => subjectApi.getChapters(subjectId!),
    enabled: !!subjectId,
  });
}

export function useTopics(chapterId: string | undefined) {
  return useQuery({
    queryKey: ['topics', chapterId],
    queryFn: () => subjectApi.getTopics(chapterId!),
    enabled: !!chapterId,
  });
}
```

---

### Step 4: Board Selection Screen

**`app/(app)/exam/board-selection.tsx`**
```tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useBoards } from '@/features/board_selection/hooks/useBoards';
import { useProfileStore } from '@/features/profile/store/profile.store';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { Board } from '@/features/board_selection/types/board.types';

// Dynamic icon based on category
function getBoardIcon(category: string): string {
  const map: Record<string, string> = {
    SSC: '📘', HSC: '📗', BCS: '🏛️',
    Admission: '🎓', Job: '💼',
  };
  return map[category] ?? '📚';
}

export default function BoardSelectionScreen() {
  const router = useRouter();
  const { data: boards, isLoading } = useBoards();
  const { updateProfile } = useProfileStore();

  const handleSelect = async (board: Board) => {
    await updateProfile({ boardId: board.id });
    router.push({ pathname: '/(app)/exam/subject-selection', params: { boardId: board.id, boardName: board.name } });
  };

  if (isLoading) return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Board</Text>
      <FlatList
        data={boards}
        keyExtractor={b => b.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemWrapper} onPress={() => handleSelect(item)}>
            <GlassCard style={styles.card}>
              <Text style={styles.icon}>{getBoardIcon(item.category)}</Text>
              <Text style={styles.boardName}>{item.name}</Text>
              <Text style={styles.category}>{item.category}</Text>
            </GlassCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, padding: 24, paddingBottom: 0 },
  itemWrapper: { flex: 1, margin: 6 },
  card: { alignItems: 'center', paddingVertical: 20 },
  icon: { fontSize: 32, marginBottom: 8 },
  boardName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, textAlign: 'center' },
  category: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
```

---

### Step 5: Subject & Chapter Selection Screens

**`app/(app)/exam/subject-selection.tsx`**
```tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSubjects } from '@/features/subject/hooks/useSubjectHierarchy';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';

export default function SubjectSelectionScreen() {
  const { boardId, boardName } = useLocalSearchParams<{ boardId: string; boardName: string }>();
  const router = useRouter();
  const { data: subjects, isLoading } = useSubjects(boardId);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{boardName}</Text>
      <Text style={styles.subtitle}>Select a Subject</Text>
      <FlatList
        data={subjects}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/exam/chapter-selection', params: { subjectId: item.id, subjectName: item.name } })}
            style={{ marginBottom: 12 }}
          >
            <GlassCard>
              <Text style={styles.subjectName}>{item.name}</Text>
            </GlassCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, padding: 24, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, paddingHorizontal: 24, marginBottom: 8 },
  subjectName: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
});
```

**`app/(app)/exam/chapter-selection.tsx`** — Build similarly. For each chapter, show nested topics using `SectionList` or accordion expansion. Each topic should have two action buttons:
1. **"Practice"** → navigate to `/(app)/exam/practice/[params]` with `{ mode: 'byTopic', topicId }`
2. **"Study Materials"** → navigate to a study materials screen

---

## ✅ Completion Checklist

- [ ] `Board`, `Subject`, `Chapter`, `Topic` TypeScript types created
- [ ] `boardApi.ts`, `subjectApi.ts` created
- [ ] React Query hooks: `useBoards`, `useSubjects`, `useChapters`, `useTopics`
- [ ] Board Selection screen with 2-column grid and category icons
- [ ] Subject Selection screen
- [ ] Chapter Selection screen with nested topics (accordion)
- [ ] "Practice" and "Study Materials" buttons on each topic
- [ ] Profile updated with `boardId` on board selection
- [ ] Navigation flow tested end-to-end

---

## 🔗 Next: [08_QUESTION_BANK.md](./08_QUESTION_BANK.md)
