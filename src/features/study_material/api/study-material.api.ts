import { supabase } from '@/core/supabase/client';
import { StudyMaterial } from '../types/study-material.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';
import * as FileSystem from 'expo-file-system';
import { encode } from 'base64-arraybuffer';

export const studyMaterialApi = {
  async getMaterialsByTopic(topicId: string): Promise<StudyMaterial[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.studyMaterialsTable)
      .select(`*, material_topic_map!inner(*)`)
      .eq('material_topic_map.topic_id', topicId);
    if (error) throw error;
    return (data as any[]).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      materialType: row.material_type,
      storagePath: row.storage_path,
      isPremium: row.is_premium,
      topicIds: [topicId],
    }));
  },

  /**
   * Gets a URL for a material.
   * - Premium content: generates a 60-second signed URL from Supabase Storage
   * - Public content: returns the direct storage_path URL
   */
  async getMaterialUrl(material: StudyMaterial): Promise<string> {
    if (!material.isPremium) {
      // Public URL
      const { data } = supabase.storage
        .from(SupabaseConstants.studyMaterialsBucket)
        .getPublicUrl(material.storagePath);
      return data.publicUrl;
    }

    // Watermark premium PDFs
    if (material.storagePath.toLowerCase().endsWith('.pdf')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '';
        const token = session?.access_token;

        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/watermark-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            storage_path: material.storagePath,
            user_id: userId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get watermarked PDF');
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Data = encode(arrayBuffer);
        const localUri = `${FileSystem.cacheDirectory}${material.id}.pdf`;
        await FileSystem.writeAsStringAsync(localUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return localUri;
      } catch (err) {
        console.error('PDF watermarking failed, falling back to signed URL:', err);
      }
    }

    // 60-second signed URL for non-PDF premium content (or as a fallback)
    const { data, error } = await supabase.storage
      .from(SupabaseConstants.studyMaterialsBucket)
      .createSignedUrl(material.storagePath, 60); // 60 seconds
    if (error) throw error;
    return data.signedUrl;
  },
};
