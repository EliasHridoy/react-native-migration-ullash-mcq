import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
  BackHandler,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLiveExamStore } from '@/features/exam/store/live-exam.store';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ShimmerLoader } from '@/components/ShimmerLoader';
import { GradientButton } from '@/components/GradientButton';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { Colors } from '@/core/theme/colors';
import { Spacing, BorderRadius } from '@/core/theme/spacing';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function LiveExamPage() {
  return (
    <SubscriptionGate featureName="Live Exam">
      <LiveExamScreen />
    </SubscriptionGate>
  );
}

function LiveExamScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const store = useLiveExamStore();

  const [modalVisible, setModalVisible] = useState(false);

  // Reanimated pulse animation for the timer when remaining seconds < 300
  const timerOpacity = useSharedValue(1);

  useEffect(() => {
    if (store.remainingSeconds < 300 && store.remainingSeconds > 0 && store.status === 'active') {
      timerOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      timerOpacity.value = 1;
    }
  }, [store.remainingSeconds < 300, store.status]);

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: timerOpacity.value,
  }));

  // Enter exam on mount, reset on unmount
  useEffect(() => {
    if (examId && user?.id) {
      store.enterExam(examId, user.id);
    }
    return () => {
      store.reset();
    };
  }, [examId, user?.id]);

  // Handle hardware back press (Android back-navigation guard)
  useEffect(() => {
    const backAction = () => {
      if (store.status === 'active') {
        Alert.alert(
          'Exit Exam?',
          'Your progress will be submitted and you will leave the exam page.',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Exit & Submit',
              style: 'destructive',
              onPress: () => {
                store.submitExam();
              },
            },
          ]
        );
        return true; // Prevent default navigation behavior
      }
      return false;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => {
      backHandlerSubscription.remove();
    };
  }, [store.status]);

  // Navigate to results screen once submitted
  useEffect(() => {
    if (store.status === 'submitted' && examId) {
      router.replace({ pathname: '/(app)/exam/result/[examId]', params: { examId } } as any);
    }
  }, [store.status, examId]);

  const handleBackButton = () => {
    if (store.status === 'active') {
      Alert.alert(
        'Exit Exam?',
        'Your progress will be submitted and you will leave the exam page.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Exit & Submit',
            style: 'destructive',
            onPress: () => {
              store.submitExam();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleManualSubmit = () => {
    Alert.alert(
      'Submit Exam?',
      'Are you sure you want to finalise and submit your answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: () => {
            store.submitExam();
          },
        },
      ]
    );
  };

  const handleHintPress = () => {
    Alert.alert(
      'Hints Disabled',
      'Hints are disabled in Live Exams to ensure a fair test environment.'
    );
  };

  // State 1: Syncing clock
  if (store.status === 'syncing') {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.syncText}>Synchronising clock with server...</Text>
      </SafeAreaView>
    );
  }

  // State 2: Loading questions (shimmer)
  if (store.status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <ShimmerLoader width={100} height={20} borderRadius={10} />
        </View>
        <View style={styles.loadingBody}>
          <ShimmerLoader height={180} style={styles.shimmerCard} />
          <ShimmerLoader height={60} style={styles.shimmerCard} />
          <ShimmerLoader height={60} style={styles.shimmerCard} />
          <ShimmerLoader height={60} style={styles.shimmerCard} />
        </View>
      </SafeAreaView>
    );
  }

  // State 3: Submitting overlay
  if (store.status === 'submitting') {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.syncText}>Submitting your exam responses securely...</Text>
      </SafeAreaView>
    );
  }

  // State 4: Expired screen
  if (store.status === 'expired') {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <GlassCard style={styles.errorCard}>
          <Ionicons name="time-outline" size={60} color={Colors.error} style={{ marginBottom: Spacing.md }} />
          <Text style={styles.errorTitle}>Time's Up!</Text>
          <Text style={styles.errorText}>
            The live exam window has closed. Any completed progress was sent to the server.
          </Text>
          <GradientButton
            label="View Results"
            onPress={() => router.replace({ pathname: '/(app)/exam/result/[examId]', params: { examId } } as any)}
            variant="primary"
            style={{ width: '100%', marginTop: Spacing.md }}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.exitTextButton}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </GlassCard>
      </SafeAreaView>
    );
  }

  // State 5: Error screen
  if (store.status === 'error') {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <GlassCard style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={60} color={Colors.error} style={styles.errorIcon} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{store.error || 'We had trouble loading the live exam.'}</Text>
          <GradientButton
            label="Try Again"
            onPress={() => {
              if (examId && user?.id) {
                store.enterExam(examId, user.id);
              }
            }}
            variant="primary"
            style={styles.retryButton}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.exitTextButton}>
            <Text style={styles.exitText}>Go Back</Text>
          </TouchableOpacity>
        </GlassCard>
      </SafeAreaView>
    );
  }

  // Fallback if questions are empty or state is not active yet
  if (store.status !== 'active' || store.questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const currentQuestion = store.questions[store.currentIndex];
  const selectedOptionId = store.session?.selectedAnswers[currentQuestion.id];
  const progress = (store.currentIndex + 1) / store.questions.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Realtime dot indicator & status */}
        <View style={styles.realtimeContainer}>
          <View style={[styles.realtimeDot, { backgroundColor: store.isRealtimeConnected ? Colors.success : Colors.error }]} />
          <Text style={styles.realtimeText}>{store.isRealtimeConnected ? 'Live' : 'Syncing'}</Text>
        </View>

        {/* Countdown timer */}
        <Animated.View style={timerAnimatedStyle}>
          <Text style={[styles.timerText, store.showTimeWarning && { color: Colors.error }]}>
            {formatTime(store.remainingSeconds)}
          </Text>
        </Animated.View>

        <View style={styles.progressChip}>
          <Text style={styles.progressChipText}>
            Q {store.currentIndex + 1}/{store.questions.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Question Area */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={styles.questionCard}>
            <View style={styles.questionMeta}>
              <DifficultyBadge level={currentQuestion.difficultyLevel} />
              <TouchableOpacity
                onPress={handleHintPress}
                style={styles.hintButton}
                activeOpacity={0.7}
              >
                <Ionicons name="bulb-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.hintButtonText}>Hints disabled</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.questionText}>
              {currentQuestion.text}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;

            let cardBg: string = Colors.surface;
            let borderColor: string = Colors.borderSubtle;
            let badgeBg: string = Colors.border;

            if (isSelected) {
              cardBg = 'rgba(0, 210, 211, 0.15)'; // Glassy accent fill
              borderColor = Colors.accent;
              badgeBg = Colors.accent;
            }

            const optionLetters = ['A', 'B', 'C', 'D'];
            const letter = optionLetters[idx] ?? String.fromCharCode(65 + idx);

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  store.selectAnswer(currentQuestion.id, option.id);
                }}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: borderColor,
                  }
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.optionRow}>
                  <View style={[styles.optionBadge, { backgroundColor: badgeBg }]}>
                    <Text style={styles.optionBadgeText}>{letter}</Text>
                  </View>
                  <Text style={styles.optionText}>{option.optionText}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          disabled={store.currentIndex === 0}
          onPress={() => store.goToQuestion(store.currentIndex - 1)}
          style={[styles.navButton, store.currentIndex === 0 && styles.disabledNavButton]}
        >
          <Ionicons name="arrow-back" size={24} color={store.currentIndex === 0 ? Colors.textDisabled : Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.gridNavButton}
        >
          <Ionicons name="grid" size={20} color={Colors.primary} />
          <Text style={styles.gridNavText}>Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={store.currentIndex === store.questions.length - 1}
          onPress={() => store.goToQuestion(store.currentIndex + 1)}
          style={[styles.navButton, store.currentIndex === store.questions.length - 1 && styles.disabledNavButton]}
        >
          <Ionicons name="arrow-forward" size={24} color={store.currentIndex === store.questions.length - 1 ? Colors.textDisabled : Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleManualSubmit}
          style={[styles.navButton, styles.finishButton]}
        >
          <Text style={styles.finishButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Questions Grid Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Question</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.gridScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.gridContainer}>
                {store.questions.map((q, idx) => {
                  const hasAnswered = !!store.session?.selectedAnswers[q.id];
                  let circleBg: string = 'rgba(255, 255, 255, 0.05)';
                  let circleBorder: string = Colors.borderSubtle;
                  let textColor: string = Colors.textSecondary;

                  if (idx === store.currentIndex) {
                    circleBorder = Colors.accent;
                    textColor = Colors.accent;
                  } else if (hasAnswered) {
                    circleBg = Colors.primary;
                    circleBorder = Colors.primary;
                    textColor = Colors.white;
                  }

                  return (
                    <TouchableOpacity
                      key={q.id}
                      onPress={() => {
                        store.goToQuestion(idx);
                        setModalVisible(false);
                      }}
                      style={[
                        styles.gridItem,
                        {
                          backgroundColor: circleBg,
                          borderColor: circleBorder,
                          borderWidth: idx === store.currentIndex ? 2 : 1,
                        }
                      ]}
                    >
                      <Text style={[styles.gridItemText, { color: textColor }]}>
                        {idx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  syncText: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  realtimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  realtimeDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  },
  realtimeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  timerText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.accent,
  },
  progressChip: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  progressChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryLight,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  scrollBody: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingBody: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  shimmerCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
  },
  questionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    opacity: 0.6,
  },
  hintButtonText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },
  questionText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  optionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledNavButton: {
    opacity: 0.3,
  },
  gridNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
  },
  gridNavText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryLight,
  },
  finishButton: {
    width: 80,
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  finishButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '60%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  gridScroll: {
    paddingBottom: Spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  gridItem: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  errorCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  errorIcon: {
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  exitTextButton: {
    padding: Spacing.sm,
  },
  exitText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  summaryCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  summaryTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
});
