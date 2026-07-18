# 13 — Leaderboard (Agent 13)

> **Agent:** Agent 13  
> **Prerequisite:** Agent 12 complete  
> **Flutter Source:** `src/lib/features/leaderboard/`  
> **Output:** Leaderboard screen (Global + Exam-Specific tabs), podium, real-time sync

---

## 📋 Tasks

- [ ] Create `LeaderboardEntry` TypeScript type
- [ ] Create `leaderboardApi.ts` 
- [ ] Create `useLeaderboardStore` with Supabase Realtime subscription
- [ ] Build Leaderboard screen (tabs, podium, ranked list)
- [ ] Implement public vs premium access gating
- [ ] Show current user's rank highlighted

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `LeaderboardNotifier` | `useLeaderboardStore` (Zustand) |
| `leaderboard_screen.dart` | `app/(app)/leaderboard/index.tsx` |
| Riverpod Realtime listener | Supabase Realtime channel |
| `SubscriptionGate` inline | `SubscriptionGate` component |

---

## 🛠️ Implementation

### Step 1: Types

**`src/features/leaderboard/types/leaderboard.types.ts`**
```typescript
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  finalRankValue: number;
  examId?: string;
}

export type LeaderboardTab = 'global' | 'exam';
```

---

### Step 2: Leaderboard API

**`src/features/leaderboard/api/leaderboard.api.ts`**
```typescript
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
    return data.map((row: any) => ({
      rank: row.rank,
      userId: row.user_id,
      displayName: row.profiles?.full_name ?? 'Anonymous',
      avatarUrl: row.profiles?.avatar_url,
      score: row.score,
      finalRankValue: row.final_rank_value,
    }));
  },

  async getExamLeaderboard(examId: string, limit = 100): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.leaderboardSnapshotsTable)
      .select('*, profiles(full_name, avatar_url)')
      .eq('exam_id', examId)
      .order('rank', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data.map((row: any) => ({
      rank: row.rank,
      userId: row.user_id,
      displayName: row.profiles?.full_name ?? 'Anonymous',
      avatarUrl: row.profiles?.avatar_url,
      score: row.score,
      finalRankValue: row.final_rank_value,
      examId,
    }));
  },
};
```

---

### Step 3: Leaderboard Store

**`src/features/leaderboard/store/leaderboard.store.ts`**
```typescript
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
  isLoading: boolean;
  isRealtimeConnected: boolean;
  error: string | null;
}

interface LeaderboardActions {
  setTab: (tab: LeaderboardTab) => void;
  loadGlobal: () => Promise<void>;
  loadExam: (examId: string) => Promise<void>;
  subscribeToRealtime: () => () => void;
}

export const useLeaderboardStore = create<LeaderboardState & LeaderboardActions>((set, get) => ({
  activeTab: 'global',
  globalEntries: [],
  examEntries: [],
  currentExamId: null,
  isLoading: false,
  isRealtimeConnected: false,
  error: null,

  setTab: (tab) => {
    set({ activeTab: tab });
    if (tab === 'global') get().loadGlobal();
  },

  loadGlobal: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await leaderboardApi.getGlobalLeaderboard();
      set({ globalEntries: entries, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  loadExam: async (examId) => {
    set({ isLoading: true, currentExamId: examId, error: null });
    try {
      const entries = await leaderboardApi.getExamLeaderboard(examId);
      set({ examEntries: entries, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  subscribeToRealtime: () => {
    // Real-time updates when leaderboard_snapshots table changes
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: SupabaseConstants.leaderboardSnapshotsTable,
      }, () => {
        // Refresh the active tab
        const { activeTab, currentExamId } = get();
        if (activeTab === 'global') get().loadGlobal();
        else if (currentExamId) get().loadExam(currentExamId);
      })
      .subscribe((status) => {
        set({ isRealtimeConnected: status === 'SUBSCRIBED' });
      });

    return () => { supabase.removeChannel(channel); };
  },
}));
```

---

### Step 4: Leaderboard Screen

**`app/(app)/leaderboard/index.tsx`**
```tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLeaderboardStore } from '@/features/leaderboard/store/leaderboard.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { LeaderboardEntry } from '@/features/leaderboard/types/leaderboard.types';
import { LinearGradient } from 'expo-linear-gradient';

const PODIUM_COLORS = ['#C0C0C0', '#FFD700', '#CD7F32']; // Silver, Gold, Bronze
const PODIUM_RANKS = [2, 1, 3]; // Visual order: 2nd, 1st, 3rd

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const store = useLeaderboardStore();

  useEffect(() => {
    store.loadGlobal();
    const unsubscribe = store.subscribeToRealtime();
    return unsubscribe;
  }, []);

  const entries = store.activeTab === 'global' ? store.globalEntries : store.examEntries;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>🏆 Leaderboard</Text>

      {/* Tab Selector */}
      <View style={styles.tabs}>
        {(['global', 'exam'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, store.activeTab === tab && styles.activeTab]}
            onPress={() => store.setTab(tab)}
          >
            <Text style={[styles.tabText, store.activeTab === tab && styles.activeTabText]}>
              {tab === 'global' ? 'Global' : 'Exam'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Podium (Top 3) */}
      {top3.length === 3 && (
        <View style={styles.podium}>
          {PODIUM_RANKS.map((rank) => {
            const entry = top3[rank - 1];
            const isFirst = rank === 1;
            return (
              <View key={rank} style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
                <Text style={{ fontSize: isFirst ? 32 : 28, textAlign: 'center' }}>
                  {entry?.avatarUrl ? '👤' : (entry?.displayName?.[0] ?? '?')}
                </Text>
                <LinearGradient
                  colors={[PODIUM_COLORS[rank - 1], 'transparent']}
                  style={[styles.podiumBase, isFirst && styles.podiumBaseFirst]}
                >
                  <Text style={styles.podiumRank}>#{rank}</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>{entry?.displayName}</Text>
                  <Text style={styles.podiumScore}>{entry?.score.toFixed(0)}</Text>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      )}

      {/* Ranked List */}
      <FlatList
        data={rest}
        keyExtractor={e => e.userId}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <RankRow entry={item} isCurrentUser={item.userId === user?.id} />
        )}
      />
    </View>
  );
}

function RankRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  return (
    <GlassCard style={[styles.rankRow, isCurrentUser && styles.currentUserRow]}>
      <Text style={styles.rankNum}>#{entry.rank}</Text>
      <View style={styles.rankInfo}>
        <Text style={styles.rankName}>{entry.displayName}</Text>
        <Text style={styles.rankScore}>{entry.score.toFixed(2)} pts</Text>
      </View>
      {isCurrentUser && <View style={styles.youBadge}><Text style={styles.youText}>YOU</Text></View>}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, padding: 20, paddingBottom: 8 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontFamily: 'Inter_500Medium' },
  activeTabText: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 8, gap: 8 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginBottom: 20 },
  podiumBase: { width: '100%', paddingTop: 12, paddingBottom: 8, alignItems: 'center', borderRadius: 12 },
  podiumBaseFirst: { paddingTop: 20 },
  podiumRank: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.white },
  podiumName: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  podiumScore: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  currentUserRow: { borderWidth: 1, borderColor: Colors.primary },
  rankNum: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textMuted, width: 36 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  rankScore: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  youBadge: { backgroundColor: 'rgba(108,92,231,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  youText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary },
});
```

---

## ✅ Completion Checklist

- [ ] `LeaderboardEntry` type created
- [ ] `leaderboardApi.ts` — global and exam-specific fetching
- [ ] `useLeaderboardStore` with Realtime subscription
- [ ] Leaderboard screen with Global / Exam tabs
- [ ] Podium display for top 3 (Gold/Silver/Bronze)
- [ ] Current user row highlighted with "YOU" badge
- [ ] Realtime refresh when `leaderboard_snapshots` changes
- [ ] Premium gating: advanced analytics wrapped in `SubscriptionGate`

---

## 🔗 Next: [14_AI_TUTOR_AND_PEDAGOGY.md](./14_AI_TUTOR_AND_PEDAGOGY.md)
