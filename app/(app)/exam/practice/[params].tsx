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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePracticeExamStore } from '@/features/exam/store/practice-exam.store';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ShimmerLoader } from '@/components/ShimmerLoader';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';
import { Spacing, BorderRadius } from '@/core/theme/spacing';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PracticeExamScreen() {
  const { params: routeParam, mode, topicId, chapterId, subjectId } = useLocalSearchParams<{
    params: string;
    mode: string;
    topicId?: string;
    chapterId?: string;
    subjectId?: string;
  }>();

  const router = useRouter();
  const { user } = useAuthStore();
  const store = usePracticeExamStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [explanationExpanded, setExplanationExpanded] = useState(false);

  // Load session on mount and when params change
  useEffect(() => {
    const activeMode = (mode || 'byTopic');
    const finalParams = {
      mode: activeMode,
      topicId: activeMode === 'byTopic' ? (topicId || routeParam) : undefined,
      chapterId: activeMode === 'byChapter' ? (chapterId || routeParam) : undefined,
      subjectId: activeMode === 'bySubject' ? (subjectId || routeParam) : undefined,
    };
    
    if (user?.id) {
      store.loadSession(finalParams, user.id);
    }

    return () => {
      store.resetSession();
    };
  }, [routeParam, mode, topicId, chapterId, subjectId, user?.id]);

  const {
    status,
    questions,
    currentIndex,
    answers,
    completedCount,
    error,
    selectAnswer,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    completeSession,
  } = store;

  // Reset explanation expansion when active question changes
  useEffect(() => {
    setExplanationExpanded(false);
  }, [currentIndex]);

  // Loading UI: 3 ShimmerLoader cards
  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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

  // Error state
  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <GlassCard style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={60} color={Colors.error} style={styles.errorIcon} />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error || 'We couldn\'t load your practice exam.'}</Text>
          <GradientButton
            label="Try Again"
            onPress={() => {
              const activeMode = (mode || 'byTopic');
              if (user?.id) {
                store.loadSession({
                  mode: activeMode,
                  topicId: activeMode === 'byTopic' ? (topicId || routeParam) : undefined,
                  chapterId: activeMode === 'byChapter' ? (chapterId || routeParam) : undefined,
                  subjectId: activeMode === 'bySubject' ? (subjectId || routeParam) : undefined,
                }, user.id);
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

  // Completed State: Summary screen
  if (status === 'completed') {
    const totalQuestions = questions.length;
    const answeredList = Object.values(answers);
    const correctCount = answeredList.filter(a => a.state === 'correct').length;
    const incorrectCount = answeredList.filter(a => a.state === 'incorrect').length;
    const unansweredCount = totalQuestions - answeredList.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🎉 Session Completed!</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentText}>{scorePercent}%</Text>
            <Text style={styles.scoreSubtext}>Accuracy Score</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.statLabel}>Correct Answers</Text>
              <Text style={styles.statValue}>{correctCount}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.statLabel}>Incorrect Answers</Text>
              <Text style={styles.statValue}>{incorrectCount}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: Colors.textMuted }]} />
              <Text style={styles.statLabel}>Unanswered</Text>
              <Text style={styles.statValue}>{unansweredCount}</Text>
            </View>
          </View>

          <GradientButton
            label="Practice Again"
            onPress={() => {
              const activeMode = (mode || 'byTopic');
              if (user?.id) {
                store.loadSession({
                  mode: activeMode,
                  topicId: activeMode === 'byTopic' ? (topicId || routeParam) : undefined,
                  chapterId: activeMode === 'byChapter' ? (chapterId || routeParam) : undefined,
                  subjectId: activeMode === 'bySubject' ? (subjectId || routeParam) : undefined,
                }, user.id);
              }
            }}
            variant="primary"
            style={styles.summaryButton}
          />
          
          <TouchableOpacity onPress={() => router.back()} style={styles.summaryExitButton}>
            <Text style={styles.summaryExitText}>Exit Practice</Text>
          </TouchableOpacity>
        </GlassCard>
      </SafeAreaView>
    );
  }

  // Fallback for idle state
  if (status === 'idle' || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isAnswered = !!currentAnswer;
  const progress = (currentIndex + 1) / questions.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* AppBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice Exam</Text>
        <View style={styles.progressChip}>
          <Text style={styles.progressChipText}>
            Q {currentIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={styles.questionCard}>
            <View style={styles.questionMeta}>
              <View style={styles.badgeRow}>
                <DifficultyBadge level={currentQuestion.difficultyLevel} />
                <TouchableOpacity
                  style={styles.hintButton}
                  disabled={true}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bulb-outline" size={14} color={Colors.textDisabled} />
                  <Text style={styles.hintButtonText}>Hint</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.completedInfoText}>
                Total Correct: {completedCount}
              </Text>
            </View>
            <Text style={styles.questionText}>
              {currentQuestion.text}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {currentQuestion.options.map((option, idx) => {
            const isSelected = currentAnswer?.selectedOptionId === option.id;
            const isCorrect = option.isCorrect;

            let cardBg: string = Colors.surface;
            let borderColor: string = Colors.borderSubtle;
            let badgeBg: string = Colors.border;

            if (isAnswered) {
              if (isCorrect) {
                cardBg = 'rgba(81, 207, 102, 0.15)';
                borderColor = Colors.success;
                badgeBg = Colors.success;
              } else if (isSelected) {
                cardBg = 'rgba(255, 107, 107, 0.15)';
                borderColor = Colors.error;
                badgeBg = Colors.error;
              }
            }

            const optionLetters = ['A', 'B', 'C', 'D'];
            const letter = optionLetters[idx] ?? String.fromCharCode(65 + idx);

            return (
              <TouchableOpacity
                key={option.id}
                disabled={isAnswered}
                onPress={() => {
                  if (user?.id) {
                    selectAnswer(currentQuestion.id, option.id, user.id);
                  }
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

        {/* Explanation Card */}
        {isAnswered && currentQuestion.explanation && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <GlassCard style={styles.explanationCard}>
              <TouchableOpacity
                onPress={() => setExplanationExpanded(!explanationExpanded)}
                style={styles.explanationHeader}
                activeOpacity={0.7}
              >
                <View style={styles.explanationTitleRow}>
                  <Ionicons name="bulb" size={18} color={Colors.warning} />
                  <Text style={styles.explanationTitle}>Explanation</Text>
                </View>
                <Ionicons
                  name={explanationExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {explanationExpanded && (
                <Text style={styles.explanationText}>
                  {currentQuestion.explanation}
                </Text>
              )}
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={previousQuestion}
          style={[styles.navButton, currentIndex === 0 && styles.disabledNavButton]}
        >
          <Ionicons name="arrow-back" size={24} color={currentIndex === 0 ? Colors.textDisabled : Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.gridNavButton}
        >
          <Ionicons name="grid" size={20} color={Colors.primary} />
          <Text style={styles.gridNavText}>Questions</Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity
            onPress={completeSession}
            style={[styles.navButton, styles.finishButton]}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={nextQuestion}
            style={styles.navButton}
          >
            <Ionicons name="arrow-forward" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
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
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  let circleBg: string = 'rgba(255, 255, 255, 0.05)';
                  let circleBorder: string = Colors.borderSubtle;
                  let textColor: string = Colors.textSecondary;

                  if (idx === currentIndex) {
                    circleBorder = Colors.primary;
                    textColor = Colors.primary;
                  }

                  if (ans) {
                    if (ans.state === 'correct') {
                      circleBg = Colors.success;
                      circleBorder = Colors.success;
                      textColor = Colors.white;
                    } else {
                      circleBg = Colors.error;
                      circleBorder = Colors.error;
                      textColor = Colors.white;
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={q.id}
                      onPress={() => {
                        goToQuestion(idx);
                        setModalVisible(false);
                      }}
                      style={[
                        styles.gridItem,
                        {
                          backgroundColor: circleBg,
                          borderColor: circleBorder,
                          borderWidth: idx === currentIndex ? 2 : 1,
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  },
  hintButtonText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textDisabled,
  },
  completedInfoText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
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
  explanationCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.15)',
    marginBottom: Spacing.lg,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  explanationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  explanationTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.warning,
  },
  explanationText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
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
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.05)',
    marginBottom: Spacing.xl,
  },
  scorePercentText: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  scoreSubtext: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsContainer: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  summaryButton: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  summaryExitButton: {
    padding: Spacing.sm,
  },
  summaryExitText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
});
