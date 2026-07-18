export type LiveExamStatus =
  | 'syncing'       // Syncing clock
  | 'loading'       // Fetching questions
  | 'active'        // Exam in progress
  | 'submitting'    // Submitting answers
  | 'submitted'     // Successfully submitted
  | 'expired'       // Exam time ended
  | 'error';        // Error state

export interface LiveExamSession {
  id: string;
  examId: string;
  userId: string;
  questionOrder: string[];   // Ordered question IDs
  selectedAnswers: Record<string, string>; // questionId → optionId
  submitted: boolean;
  submittedAt?: string;
  clientOffset: number;      // ms offset between client and server
}

export interface LiveExam {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed';
  durationMinutes: number;
}
