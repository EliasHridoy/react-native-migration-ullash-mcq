import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export interface HintRequest {
  questionId: string;
  questionText: string;
  userSelectedOptionText?: string;
  hintDepth: 1 | 2 | 3; // Progressive depth
}

export interface HintResponse {
  hint: string;
  hintDepth: number;
  hintsRemaining: number;
}

export interface SemanticSearchResult {
  materialId: string;
  title: string;
  excerpt: string;
  similarity: number;
  materialType: string;
}

export const aiTutorApi = {
  async getHint(request: HintRequest): Promise<HintResponse> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.generateHintFunction,
      {
        body: {
          question_id: request.questionId,
          question_text: request.questionText,
          user_selection: request.userSelectedOptionText,
          hint_depth: request.hintDepth,
        },
      }
    );
    if (error) throw error;
    return {
      hint: data.hint,
      hintDepth: data.hint_depth,
      hintsRemaining: data.hints_remaining,
    };
  },

  async semanticSearch(query: string): Promise<SemanticSearchResult[]> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.semanticSearchFunction,
      { body: { query } }
    );
    if (error) throw error;
    return (data.results ?? []).map((r: Record<string, unknown>) => ({
      materialId: r.id as string,
      title: r.title as string,
      excerpt: r.excerpt as string,
      similarity: r.similarity as number,
      materialType: r.material_type as string,
    }));
  },

  async checkHintUsage(questionId: string, userId: string): Promise<number> {
    const { data } = await supabase
      .from(SupabaseConstants.hintUsageTable)
      .select('hint_count')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .maybeSingle();
    return data?.hint_count ?? 0;
  },
};
