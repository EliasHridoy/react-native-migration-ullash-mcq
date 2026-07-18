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
    try {
      await updateProfile({ boardId: board.id });
    } catch (e) {
      console.error('Failed to update profile with boardId:', e);
    }
    router.push({ pathname: '/(app)/exam/subject-selection' as any, params: { boardId: board.id, boardName: board.name } });
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
