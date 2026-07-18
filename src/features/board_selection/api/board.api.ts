import { supabase } from '@/core/supabase/client';
import { Board } from '../types/board.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const boardApi = {
  async getBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.boardsTable)
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      createdAt: row.created_at,
    }));
  },
};
