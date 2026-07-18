export interface TopicResult {
  topicId: string;
  topicName: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number; // 0-1
}

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  score: number;
  finalRankValue: number;
  rank: number;
  totalParticipants: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  topicResults: TopicResult[];
  submittedAt: string;
}

export interface ExamRecord {
  examId: string;
  examTitle: string;
  score: number;
  rank: number;
  totalParticipants: number;
  submittedAt: string;
}
