import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChapters, useTopics } from '@/features/subject/hooks/useSubjectHierarchy';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { Chapter } from '@/features/subject/types/subject.types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function ChapterItem({ chapter }: { chapter: Chapter }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  // Fetch topics only when expanded
  const { data: topics, isLoading } = useTopics(expanded ? chapter.id : undefined);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <GlassCard style={styles.chapterCard}>
      <TouchableOpacity onPress={toggleExpand} style={styles.chapterHeader} activeOpacity={0.7}>
        <Text style={styles.chapterName}>{chapter.name}</Text>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.topicsContainer}>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : topics && topics.length > 0 ? (
            topics.map(topic => (
              <View key={topic.id} style={styles.topicRow}>
                <Text style={styles.topicName}>{topic.name}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: `/(app)/exam/practice/${topic.id}` as any,
                      params: { mode: 'byTopic', topicId: topic.id }
                    })}
                    style={[styles.button, styles.practiceButton]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Practice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: `/(app)/exam/study-materials/${topic.id}` as any
                    })}
                    style={[styles.button, styles.studyButton]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Study</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noTopics}>No topics available</Text>
          )}
        </View>
      )}
    </GlassCard>
  );
}

export default function ChapterSelectionScreen() {
  const { subjectId, subjectName } = useLocalSearchParams<{ subjectId: string; subjectName: string }>();
  const { data: chapters, isLoading } = useChapters(subjectId);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{subjectName}</Text>
      <Text style={styles.subtitle}>Select a Chapter & Topic</Text>
      <FlatList
        data={chapters}
        keyExtractor={c => c.id}
        renderItem={({ item }) => <ChapterItem chapter={item} />}
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
  chapterCard: { marginBottom: 12, padding: 0 },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  chapterName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, flex: 1 },
  arrow: { fontSize: 14, color: Colors.primary, marginLeft: 8 },
  topicsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    padding: 12,
    gap: 8,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  topicName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, flex: 1, marginRight: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  practiceButton: { backgroundColor: Colors.primary },
  studyButton: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  buttonText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  noTopics: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginVertical: 8 },
});
