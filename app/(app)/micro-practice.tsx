import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/core/theme/colors';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { HintButton } from '@/components/HintButton';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { questionApi } from '@/features/exam/api/question.api';
import { questionStatusApi } from '@/features/exam/api/question-status.api';

import { usePedagogyStore } from '@/features/pedagogy/store/pedagogy.store';
import { Question, Option } from '@/features/exam/types/question.types';

type FeedbackState = 'idle' | 'correct' | 'incorrect';

export default function MicroPracticeScreen() {
  const { topicId, practiceId } = useLocalSearchParams<{ topicId: string; practiceId?: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const markPracticeComplete = usePedagogyStore(s => s.markPracticeComplete);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedbackOpacity = useSharedValue(0);
  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackOpacity.value }],
  }));

  useEffect(() => {
    if (!topicId) return;
    (async () => {
      setLoading(true);
      try {
        const qs = await questionApi.getQuestionsByTopic(topicId);
        if (qs.length === 0) { setError('No questions found for this topic'); return; }
        // Shuffle and take up to 10
        const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, 10);
        setQuestions(shuffled);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load questions');
      } finally { setLoading(false); }
    })();
  }, [topicId]);

  const currentQ = questions[currentIdx];

  const handleSelect = useCallback(async (optionId: string) => {
    if (feedback !== 'idle' || !currentQ || !user) return;
    setSelectedOption(optionId);
    const option = currentQ.options.find(o => o.id === optionId);
    const isCorrect = option?.isCorrect ?? false;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    feedbackOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    setScore(p => ({ correct: p.correct + (isCorrect ? 1 : 0), total: p.total + 1 }));

    try {
      if (isCorrect) await questionStatusApi.markComplete(user.id, currentQ.id);
      else await questionStatusApi.markIncomplete(user.id, currentQ.id);
    } catch { /* non-critical */ }
  }, [feedback, currentQ, user, feedbackOpacity]);

  const handleNext = useCallback(() => {
    feedbackOpacity.value = withTiming(0, { duration: 150 });
    setSelectedOption(null);
    setFeedback('idle');
    if (currentIdx + 1 >= questions.length) {
      const finalScore = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
      setCompleted(true);
      if (practiceId) markPracticeComplete(practiceId, finalScore);
    } else {
      setCurrentIdx(p => p + 1);
    }
  }, [currentIdx, questions.length, practiceId, markPracticeComplete, feedbackOpacity]);

  const getOptionStyle = (opt: Option) => {
    if (feedback === 'idle') return selectedOption === opt.id ? s.optSelected : s.opt;
    if (opt.isCorrect) return s.optCorrect;
    if (opt.id === selectedOption && !opt.isCorrect) return s.optWrong;
    return s.opt;
  };

  const getOptionTextStyle = (opt: Option) => {
    if (feedback === 'idle') return s.optText;
    if (opt.isCorrect) return s.optTextCorrect;
    if (opt.id === selectedOption && !opt.isCorrect) return s.optTextWrong;
    return s.optText;
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={{ color: Colors.error, fontSize: 15, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <GradientButton label="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (completed) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{pct >= 70 ? '🎉' : '💪'}</Text>
          <Text style={s.compTitle}>Session Complete!</Text>
          <Text style={s.compScore}>{score.correct} / {score.total} correct ({pct}%)</Text>
          <GradientButton label="Back to Home" onPress={() => router.back()} style={{ marginTop: 24, width: 200 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.root}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backT}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Micro Practice</Text>
          <Text style={s.progress}>{currentIdx + 1}/{questions.length}</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%` }]} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {currentQ && (
            <>
              <GlassCard>
                <Text style={s.qNum}>Question {currentIdx + 1}</Text>
                <Text style={s.qText}>{currentQ.text}</Text>
              </GlassCard>

              <View style={{ gap: 10, marginTop: 16 }}>
                {currentQ.options.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={getOptionStyle(opt)}
                    onPress={() => handleSelect(opt.id)}
                    disabled={feedback !== 'idle'}
                    activeOpacity={0.7}
                  >
                    <Text style={getOptionTextStyle(opt)}>
                      {feedback !== 'idle' && opt.isCorrect ? '✓ ' : ''}
                      {feedback !== 'idle' && opt.id === selectedOption && !opt.isCorrect ? '✗ ' : ''}
                      {opt.optionText}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback */}
              {feedback !== 'idle' && (
                <Animated.View style={[s.feedbackCard, feedbackStyle]}>
                  <Text style={s.feedbackIcon}>{feedback === 'correct' ? '✅' : '❌'}</Text>
                  <Text style={[s.feedbackText, { color: feedback === 'correct' ? Colors.success : Colors.error }]}>
                    {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                  </Text>
                  {currentQ.explanation && (
                    <Text style={s.explanationText}>{currentQ.explanation}</Text>
                  )}
                </Animated.View>
              )}

              {/* Actions */}
              <View style={s.actions}>
                {user && (
                  <HintButton
                    questionId={currentQ.id}
                    questionText={currentQ.text}
                    selectedOptionText={currentQ.options.find(o => o.id === selectedOption)?.optionText}
                    userId={user.id}
                    disabled={feedback !== 'idle'}
                  />
                )}
                {feedback !== 'idle' && (
                  <GradientButton
                    label={currentIdx + 1 >= questions.length ? 'Finish' : 'Next →'}
                    onPress={handleNext}
                    style={{ minWidth: 120 }}
                  />
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between' },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backT: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold' },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  progress: { color: Colors.textMuted, fontSize: 13, fontFamily: 'Inter_500Medium' },
  progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  qNum: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  qText: { color: Colors.textPrimary, fontSize: 16, lineHeight: 24, fontFamily: 'Inter_500Medium' },
  opt: { backgroundColor: Colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderSubtle },
  optSelected: { backgroundColor: 'rgba(108,92,231,0.1)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary },
  optCorrect: { backgroundColor: 'rgba(81,207,102,0.1)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.success },
  optWrong: { backgroundColor: 'rgba(255,107,107,0.1)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.error },
  optText: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  optTextCorrect: { color: Colors.success, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  optTextWrong: { color: Colors.error, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  feedbackCard: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: Colors.surfaceElevated, alignItems: 'center' },
  feedbackIcon: { fontSize: 28, marginBottom: 4 },
  feedbackText: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  explanationText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 12 },
  compTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 8 },
  compScore: { fontSize: 16, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
});
