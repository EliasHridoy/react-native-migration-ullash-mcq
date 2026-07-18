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
            onPress={() => router.push({ pathname: '/(app)/exam/chapter-selection' as any, params: { subjectId: item.id, subjectName: item.name } })}
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
