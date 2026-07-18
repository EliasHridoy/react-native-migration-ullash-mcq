export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type PracticeExamMode = 'byTopic' | 'byChapter' | 'bySubject' | 'byOrigin';

export interface Option {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  serialNo: number;
}

export interface Question {
  id: string;
  text: string;
  explanation?: string;
  difficultyLevel: DifficultyLevel;
  options: Option[];
  // Hierarchy (from join)
  hierarchyMap?: QuestionHierarchyMap;
  originMap?: QuestionOriginMap;
}

export interface QuestionHierarchyMap {
  questionId: string;
  topicId: string;
  chapterId: string;
  subjectId: string;
}

export interface QuestionOriginMap {
  questionId: string;
  boardId: string;
  examYear: number;
  examType: string;
}

export interface QuestionStatus {
  questionId: string;
  userId: string;
  isCompleted: boolean;
}

export interface PracticeExamParams {
  mode: PracticeExamMode;
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  boardId?: string;
  examYear?: number;
}
