import { supabase } from '@/core/supabase/client';
import { Question, Option } from '../types/question.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

function parseOptions(raw: any[]): Option[] {
  return (raw ?? []).map(o => ({
    id: o.id,
    questionId: o.question_id,
    optionText: o.option_text,
    isCorrect: o.is_correct,
    serialNo: o.serial_no,
  }));
}

function parseQuestion(row: any): Question {
  const q: Question = {
    id: row.id,
    text: row.text,
    explanation: row.explanation ?? row.explanation_text ?? undefined,
    difficultyLevel: row.difficulty_level,
    options: parseOptions(row.options ?? []),
  };

  if (row.question_hierarchy_map) {
    const h = Array.isArray(row.question_hierarchy_map) ? row.question_hierarchy_map[0] : row.question_hierarchy_map;
    if (h) {
      q.hierarchyMap = {
        questionId: h.question_id,
        topicId: h.topic_id,
        chapterId: h.chapter_id,
        subjectId: h.subject_id,
      };
    }
  }

  if (row.question_origin_map) {
    const o = Array.isArray(row.question_origin_map) ? row.question_origin_map[0] : row.question_origin_map;
    if (o) {
      q.originMap = {
        questionId: o.question_id,
        boardId: o.board_id,
        examYear: o.exam_year,
        examType: o.exam_type,
      };
    }
  }

  return q;
}

export const questionApi = {
  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_hierarchy_map!inner(*)`)
      .eq('question_hierarchy_map.topic_id', topicId);
    if (error) throw error;
    return (data || []).map(parseQuestion);
  },

  async getQuestionsByChapter(chapterId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_hierarchy_map!inner(*)`)
      .eq('question_hierarchy_map.chapter_id', chapterId);
    if (error) throw error;
    return (data || []).map(parseQuestion);
  },

  async getQuestionsBySubject(subjectId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_hierarchy_map!inner(*)`)
      .eq('question_hierarchy_map.subject_id', subjectId);
    if (error) throw error;
    return (data || []).map(parseQuestion);
  },

  async getQuestionsByOrigin(boardId: string, year: number): Promise<Question[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*), question_origin_map!inner(*)`)
      .eq('question_origin_map.board_id', boardId)
      .eq('question_origin_map.exam_year', year);
    if (error) throw error;
    return (data || []).map(parseQuestion);
  },

  async searchQuestions(query: string, signal?: AbortSignal): Promise<Question[]> {
    if (!query || query.trim().length < 2) return [];
    
    const queryBuilder = supabase
      .from(SupabaseConstants.questionsTable)
      .select(`*, options(*)`)
      .textSearch('text', query, { config: 'english' })
      .limit(20);

    if (signal) {
      queryBuilder.abortSignal(signal);
    }

    const { data, error } = await queryBuilder;
    if (error) {
      // If query was aborted, return empty list cleanly
      if (error.message?.includes('aborted') || error.code === '20') {
        return [];
      }
      throw error;
    }
    return (data || []).map(parseQuestion);
  },
};
