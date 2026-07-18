import { supabase } from '@/core/supabase/client';
import { Chapter, Subject, Topic } from '../types/subject.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const subjectApi = {
  async getSubjects(boardId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.subjectsTable)
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      boardId: boardId,
      createdAt: row.created_at,
    }));
  },

  async getChapters(subjectId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.chaptersTable)
      .select('*')
      .eq('subject_id', subjectId)
      .order('name');
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      subjectId: row.subject_id,
      createdAt: row.created_at,
    }));
  },

  async getTopics(chapterId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.topicsTable)
      .select('*')
      .eq('chapter_id', chapterId)
      .order('name');
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      chapterId: row.chapter_id,
      createdAt: row.created_at,
    }));
  },
};
