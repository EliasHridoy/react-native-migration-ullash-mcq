import { useQuery } from '@tanstack/react-query';
import { boardApi } from '../api/board.api';

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: boardApi.getBoards,
    staleTime: 1000 * 60 * 60, // 1 hour — boards rarely change
  });
}
