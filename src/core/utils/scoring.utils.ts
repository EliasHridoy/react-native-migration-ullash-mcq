export interface ScoringParams {
  correctAnswers: number;
  wrongAnswers: number;
  penaltyFactor?: number;
}

export interface FinalRankParams extends ScoringParams {
  timeTakenSeconds: number;
  totalTimeSeconds: number;
}

export interface TopicResult {
  topicId: string;
  topicName: string;
  correct: number;
  incorrect: number;
  unanswered: number;
}

/**
 * Calculates the base exam score.
 * Score = Correct - (Wrong × PenaltyFactor)
 */
export function calculateScore({
  correctAnswers,
  wrongAnswers,
  penaltyFactor = 0.25,
}: ScoringParams): number {
  return correctAnswers - wrongAnswers * penaltyFactor;
}

/**
 * Calculates the final rank value including tie-breaker.
 * FinalRankValue = Score + (1 - TimeTaken / TotalTime)
 */
export function calculateFinalRankValue({
  correctAnswers,
  wrongAnswers,
  penaltyFactor = 0.25,
  timeTakenSeconds,
  totalTimeSeconds,
}: FinalRankParams): number {
  const score = calculateScore({ correctAnswers, wrongAnswers, penaltyFactor });

  if (totalTimeSeconds <= 0) return score;

  const timeFraction = Math.min(1, timeTakenSeconds / totalTimeSeconds);
  const tieBreakerBonus = 1 - timeFraction;

  return score + tieBreakerBonus;
}

/**
 * Generates a weakness vector from topic results.
 * Returns topics where accuracy is below the 60% threshold.
 */
export function generateWeaknessVector(
  topicResults: TopicResult[],
  threshold = 0.6,
): TopicResult[] {
  return topicResults.filter((topic) => {
    const total = topic.correct + topic.incorrect;
    if (total === 0) return false;
    const accuracy = topic.correct / total;
    return accuracy < threshold;
  });
}
