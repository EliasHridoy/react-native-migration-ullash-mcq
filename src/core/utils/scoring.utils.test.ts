import { calculateScore, calculateFinalRankValue, generateWeaknessVector } from './scoring.utils';

describe('calculateScore', () => {
  it('returns correct - wrong * 0.25', () => {
    expect(calculateScore({ correctAnswers: 10, wrongAnswers: 4 })).toBe(9);
  });

  it('handles zero wrong answers', () => {
    expect(calculateScore({ correctAnswers: 5, wrongAnswers: 0 })).toBe(5);
  });

  it('handles custom penalty factor', () => {
    expect(calculateScore({ correctAnswers: 10, wrongAnswers: 4, penaltyFactor: 0.5 })).toBe(8);
  });
});

describe('calculateFinalRankValue', () => {
  it('adds tie-breaker bonus', () => {
    const score = calculateFinalRankValue({
      correctAnswers: 10, wrongAnswers: 0,
      timeTakenSeconds: 30, totalTimeSeconds: 60,
    });
    expect(score).toBe(10.5); // 10 + (1 - 0.5)
  });

  it('guards against zero total time', () => {
    const score = calculateFinalRankValue({
      correctAnswers: 10, wrongAnswers: 0,
      timeTakenSeconds: 30, totalTimeSeconds: 0,
    });
    expect(score).toBe(10);
  });
});

describe('generateWeaknessVector', () => {
  it('filters topics below 60% threshold', () => {
    const topics = [
      { topicId: '1', topicName: 'A', correct: 3, incorrect: 7, unanswered: 0 }, // 30%
      { topicId: '2', topicName: 'B', correct: 7, incorrect: 3, unanswered: 0 }, // 70%
      { topicId: '3', topicName: 'C', correct: 0, incorrect: 0, unanswered: 5 }, // 0/0 → skip
    ];
    const weak = generateWeaknessVector(topics);
    expect(weak).toHaveLength(1);
    expect(weak[0].topicId).toBe('1');
  });
});
