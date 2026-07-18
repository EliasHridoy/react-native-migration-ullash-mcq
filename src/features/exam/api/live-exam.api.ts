import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';
import { LiveExam, LiveExamSession } from '../types/live-exam.types';
import { Question } from '../types/question.types';

export const liveExamApi = {
  async getExam(examId: string): Promise<LiveExam> {
    const { data, error } = await supabase
      .from(SupabaseConstants.examsTable)
      .select('*')
      .eq('id', examId)
      .single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status as 'scheduled' | 'active' | 'completed',
      durationMinutes: data.duration_minutes,
    };
  },

  async getExamQuestions(examId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.examQuestionListTable)
      .select(`*, questions(*, options(*))`)
      .eq('exam_id', examId)
      .order('display_order');
    if (error) throw error;
    return data.map((row: any) => ({
      id: row.questions.id,
      text: row.questions.text,
      explanation: row.questions.explanation,
      difficultyLevel: row.questions.difficulty_level,
      options: (row.questions.options ?? []).map((o: any) => ({
        id: o.id,
        questionId: o.question_id,
        optionText: o.option_text,
        isCorrect: o.is_correct,
        serialNo: o.serial_no,
      })),
    }));
  },

  async getOrCreateSession(examId: string, userId: string, questionOrder: string[]): Promise<LiveExamSession> {
    // Try to get existing session (for reconnect safety)
    const { data: existing } = await supabase
      .from(SupabaseConstants.userExamSessionsTable)
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return {
        id: existing.id,
        examId: existing.exam_id,
        userId: existing.user_id,
        questionOrder: (existing.question_order as string[]) ?? [],
        selectedAnswers: (existing.selected_answers as Record<string, string>) ?? {},
        submitted: existing.is_submitted,
        submittedAt: existing.submitted_at ?? undefined,
        clientOffset: existing.client_offset_ms ?? 0,
      };
    }

    // Create new session
    const { data, error } = await supabase
      .from(SupabaseConstants.userExamSessionsTable)
      .insert({
        exam_id: examId,
        user_id: userId,
        question_order: questionOrder,
        selected_answers: {},
        is_submitted: false,
        shuffle_seed: Math.floor(Math.random() * 1000000), // Default required seed in some schemas
      })
      .select()
      .single();
    if (error) throw error;

    return {
      id: data.id,
      examId: data.exam_id,
      userId: data.user_id,
      questionOrder: (data.question_order as string[]) ?? [],
      selectedAnswers: {},
      submitted: data.is_submitted,
      clientOffset: 0,
    };
  },

  async saveAnswers(examId: string, userId: string, answers: Record<string, string>): Promise<void> {
    await supabase
      .from(SupabaseConstants.userExamSessionsTable)
      .update({ selected_answers: answers })
      .eq('exam_id', examId)
      .eq('user_id', userId);
  },

  async submitExam(sessionId: string, answers: Record<string, string>): Promise<void> {
    // Server-authoritative SECURITY DEFINER RPC — validates timing and scores
    const { error } = await supabase.rpc(SupabaseConstants.rpcSubmitExamSession, {
      p_session_id: sessionId,
      p_answers: answers,
    });
    if (error) throw error;
  },
};
