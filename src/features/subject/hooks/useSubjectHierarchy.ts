import { useQuery } from '@tanstack/react-query';
import { subjectApi } from '../api/subject.api';

export function useSubjects(boardId: string | undefined) {
  return useQuery({
    queryKey: ['subjects', boardId],
    queryFn: () => subjectApi.getSubjects(boardId!),
    enabled: !!boardId,
  });
}

export function useChapters(subjectId: string | undefined) {
  return useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: () => subjectApi.getChapters(subjectId!),
    enabled: !!subjectId,
  });
}

export function useTopics(chapterId: string | undefined) {
  return useQuery({
    queryKey: ['topics', chapterId],
    queryFn: () => subjectApi.getTopics(chapterId!),
    enabled: !!chapterId,
  });
}
