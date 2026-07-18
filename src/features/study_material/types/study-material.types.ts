export type MaterialType = 'video' | 'pdf' | 'audio_book';

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  materialType: MaterialType;
  storagePath: string;
  isPremium: boolean;
  topicIds: string[]; // from material_topic_map join
}
