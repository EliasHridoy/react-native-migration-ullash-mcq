import { useQuery } from '@tanstack/react-query';
import { studyMaterialApi } from '../api/study-material.api';

export function useStudyMaterials(topicId: string | undefined) {
  return useQuery({
    queryKey: ['study-materials', topicId],
    queryFn: () => studyMaterialApi.getMaterialsByTopic(topicId!),
    enabled: !!topicId,
  });
}
