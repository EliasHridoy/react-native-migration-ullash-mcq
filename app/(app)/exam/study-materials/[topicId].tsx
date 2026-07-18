import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useStudyMaterials } from '@/features/study_material/hooks/useStudyMaterials';
import { studyMaterialApi } from '@/features/study_material/api/study-material.api';
import { StudyMaterial, MaterialType } from '@/features/study_material/types/study-material.types';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { useProfileStore } from '@/features/profile/store/profile.store';

function getMaterialIcon(type: MaterialType): string {
  const icons: Record<MaterialType, string> = {
    pdf: '📄',
    video: '🎬',
    audio_book: '🎧',
  };
  return icons[type];
}

export default function StudyMaterialsScreen() {
  const { topicId, topicName } = useLocalSearchParams<{ topicId: string; topicName: string }>();
  const { data: materials, isLoading } = useStudyMaterials(topicId);
  const { profile } = useProfileStore();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleOpen = async (material: StudyMaterial) => {
    // Gate premium content
    if (material.isPremium && profile?.subscriptionStatus !== 'active' && profile?.subscriptionStatus !== 'grace') {
      Alert.alert('Premium Content', 'Upgrade to Premium to access this material.', [
        { text: 'Cancel' },
        { text: 'Upgrade', onPress: () => { router.push('/paywall' as any); } },
      ]);
      return;
    }

    setOpeningId(material.id);
    try {
      const url = await studyMaterialApi.getMaterialUrl(material);
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not open material');
    } finally {
      setOpeningId(null);
    }
  };

  if (isLoading) return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{topicName ?? 'Study Materials'}</Text>
      {materials?.length === 0 && (
        <View style={styles.center}>
          <Text style={{ color: Colors.textSecondary }}>No study materials for this topic yet.</Text>
        </View>
      )}
      <FlatList
        data={materials}
        keyExtractor={m => m.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpen(item)}>
            <GlassCard>
              <View style={styles.row}>
                <Text style={styles.icon}>{getMaterialIcon(item.materialType)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialTitle}>{item.title}</Text>
                  {item.description && (
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                  )}
                </View>
                {item.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
                {openingId === item.id && (
                  <ActivityIndicator color={Colors.primary} size="small" style={{ marginLeft: 8 }} />
                )}
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, padding: 24, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28 },
  materialTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  description: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  premiumBadge: { backgroundColor: 'rgba(108,92,231,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  premiumText: { color: Colors.primary, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});
