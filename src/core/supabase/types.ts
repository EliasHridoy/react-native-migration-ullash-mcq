import { Database } from './database.types';

// Table row types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Board = Database['public']['Tables']['boards']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Option = Database['public']['Tables']['options']['Row'];
export type Exam = Database['public']['Tables']['exams']['Row'];
export type ExamQuestionList = Database['public']['Tables']['exam_question_list']['Row'];
export type UserExamResult = Database['public']['Tables']['user_exam_results']['Row'];
export type UserExamSession = Database['public']['Tables']['user_exam_sessions']['Row'];
export type QuestionStatus = Database['public']['Tables']['question_status']['Row'];
export type LeaderboardSnapshot = Database['public']['Tables']['leaderboard_snapshots']['Row'];
export type StudyMaterial = Database['public']['Tables']['study_materials']['Row'];
export type BkashTransaction = Database['public']['Tables']['bkash_transactions']['Row'];
export type UserWeaknessGap = Database['public']['Tables']['user_weakness_gaps']['Row'];
export type MicroPracticeQueue = Database['public']['Tables']['micro_practice_queue']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
