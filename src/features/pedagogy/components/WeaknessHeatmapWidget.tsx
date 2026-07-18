import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/core/theme/colors';
import { GlassCard } from '@/components/GlassCard';
import { ShimmerLoader } from '@/components/ShimmerLoader';
import { usePedagogyStore } from '../store/pedagogy.store';

interface WeaknessHeatmapWidgetProps {
  userId: string;
}

interface SubjectGroup {
  subjectId: string;
  subjectName: string;
  chapters: ChapterGroup[];
}

interface ChapterGroup {
  chapterId: string;
  chapterName: string;
  topics: TopicEntry[];
}

interface TopicEntry {
  topicId: string;
  topicName: string;
  accuracy: number;
}

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const barColor = accuracy < 40 ? Colors.error : accuracy < 60 ? Colors.warning : Colors.success;
  const glowOpacity = useSharedValue(1);

  useEffect(() => {
    if (accuracy < 40) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [accuracy, glowOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.barContainer}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { width: `${Math.max(accuracy, 5)}%`, backgroundColor: barColor },
            accuracy < 40 ? animStyle : undefined,
          ]}
        />
      </View>
      <Text style={[styles.barLabel, { color: barColor }]}>{Math.round(accuracy)}%</Text>
    </View>
  );
}

function AccordionSection({
  title,
  children,
  level,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  level: 'subject' | 'chapter';
  defaultOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <View style={level === 'subject' ? styles.subjectSection : styles.chapterSection}>
      <TouchableOpacity
        style={[styles.accordionHeader, level === 'chapter' && styles.chapterHeader]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={level === 'subject' ? styles.subjectTitle : styles.chapterTitle}>
          {expanded ? '▼' : '▶'} {title}
        </Text>
      </TouchableOpacity>
      {expanded && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
}

export function WeaknessHeatmapWidget({ userId }: WeaknessHeatmapWidgetProps) {
  const { weaknessGaps, loadingGaps, fetchWeaknessGaps } = usePedagogyStore();

  useEffect(() => {
    fetchWeaknessGaps(userId);
  }, [userId, fetchWeaknessGaps]);

  // Group gaps into Subject → Chapter → Topic hierarchy
  const hierarchy = useMemo((): SubjectGroup[] => {
    const subjectMap = new Map<string, SubjectGroup>();

    for (const gap of weaknessGaps) {
      if (!subjectMap.has(gap.subjectId)) {
        subjectMap.set(gap.subjectId, {
          subjectId: gap.subjectId,
          subjectName: gap.subjectName,
          chapters: [],
        });
      }
      const subject = subjectMap.get(gap.subjectId)!;

      let chapter = subject.chapters.find(c => c.chapterId === gap.chapterId);
      if (!chapter) {
        chapter = {
          chapterId: gap.chapterId,
          chapterName: gap.chapterName,
          topics: [],
        };
        subject.chapters.push(chapter);
      }

      chapter.topics.push({
        topicId: gap.topicId,
        topicName: gap.topicName,
        accuracy: gap.accuracy,
      });
    }

    return Array.from(subjectMap.values());
  }, [weaknessGaps]);

  if (loadingGaps) {
    return (
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>🔥 Weakness Heatmap</Text>
        <View style={{ gap: 8, marginTop: 8 }}>
          <ShimmerLoader height={32} borderRadius={8} />
          <ShimmerLoader height={32} borderRadius={8} />
          <ShimmerLoader height={32} borderRadius={8} />
        </View>
      </GlassCard>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>🔥 Weakness Heatmap</Text>
        <Text style={styles.emptyText}>No weakness gaps detected yet. Keep practicing! 🎯</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.sectionTitle}>🔥 Weakness Heatmap</Text>
      <Text style={styles.sectionSubtitle}>Topics where you need improvement</Text>

      {hierarchy.map(subject => (
        <AccordionSection
          key={subject.subjectId}
          title={subject.subjectName}
          level="subject"
          defaultOpen={hierarchy.length === 1}
        >
          {subject.chapters.map(chapter => (
            <AccordionSection
              key={chapter.chapterId}
              title={chapter.chapterName}
              level="chapter"
              defaultOpen={subject.chapters.length === 1}
            >
              {chapter.topics.map(topic => (
                <View key={topic.topicId} style={styles.topicRow}>
                  <Text style={styles.topicName} numberOfLines={1}>
                    {topic.topicName}
                  </Text>
                  <AccuracyBar accuracy={topic.accuracy * 100} />
                </View>
              ))}
            </AccordionSection>
          ))}
        </AccordionSection>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  subjectSection: {
    marginBottom: 4,
  },
  chapterSection: {
    marginLeft: 12,
    marginBottom: 2,
  },
  accordionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(108, 92, 231, 0.06)',
    marginBottom: 2,
  },
  chapterHeader: {
    backgroundColor: 'rgba(0, 210, 211, 0.06)',
  },
  subjectTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  chapterTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  accordionContent: {
    paddingLeft: 4,
    paddingTop: 4,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  topicName: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: 6,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    width: 32,
    textAlign: 'right',
  },
});
