# 09 — Study Materials (Agent 9)

> **Agent:** Agent 9  
> **Prerequisite:** Agents 1–4 complete  
> **Flutter Source:** `src/lib/features/study_material/`  
> **Output:** Study material viewer screen, signed URL generation for premium content

---

## 📋 Tasks

- [ ] Create `StudyMaterial` TypeScript type
- [ ] Create `studyMaterialApi.ts` with signed URL logic
- [ ] Create `useStudyMaterials` React Query hook
- [ ] Build Material Viewer screen
- [ ] Implement 60-second signed URL expiry for premium content

---

## Flutter → React Native Mapping

| Flutter | React Native |
|---------|-------------|
| `StudyMaterial` entity | `StudyMaterial` interface |
| `StudyMaterialRemoteDataSource` | `studyMaterialApi.ts` |
| `StudyMaterialNotifier` | `useStudyMaterials` (React Query) |
| `material_viewer_screen.dart` | `app/(app)/exam/study-materials/[topicId].tsx` |
| `url_launcher` | `expo-linking` |
| Storage `createSignedUrl` | Same API — 60s expiry |

---

## 🛠️ Implementation

### Step 1: Types

**`src/features/study_material/types/study-material.types.ts`**
```typescript
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
```

---

### Step 2: Study Material API

**`src/features/study_material/api/study-material.api.ts`**
```typescript
import { supabase } from '@/core/supabase/client';
import { StudyMaterial } from '../types/study-material.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const studyMaterialApi = {
  async getMaterialsByTopic(topicId: string): Promise<StudyMaterial[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.studyMaterialsTable)
      .select(`*, material_topic_map!inner(*)`)
      .eq('material_topic_map.topic_id', topicId);
    if (error) throw error;
    return data.map(row => ({
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

    // 60-second signed URL for premium content
    const { data, error } = await supabase.storage
      .from(SupabaseConstants.studyMaterialsBucket)
      .createSignedUrl(material.storagePath, 60); // 60 seconds
    if (error) throw error;
    return data.signedUrl;
  },
};
```

---

### Step 3: React Query Hook

**`src/features/study_material/hooks/useStudyMaterials.ts`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { studyMaterialApi } from '../api/study-material.api';

export function useStudyMaterials(topicId: string | undefined) {
  return useQuery({
    queryKey: ['study-materials', topicId],
    queryFn: () => studyMaterialApi.getMaterialsByTopic(topicId!),
    enabled: !!topicId,
  });
}
```

---

### Step 4: Material Viewer Screen

**`app/(app)/exam/study-materials/[topicId].tsx`**
```tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
        { text: 'Upgrade', onPress: () => { /* Navigate to paywall */ } },
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
```

---

## ✅ Completion Checklist

- [ ] `StudyMaterial` interface created with `MaterialType` enum
- [ ] `studyMaterialApi.ts` — `getMaterialsByTopic` and `getMaterialUrl` implemented
- [ ] 60-second signed URL for premium content verified
- [ ] `useStudyMaterials` React Query hook created
- [ ] Study Materials screen built with icons per type
- [ ] Premium content gating: shows paywall alert if not subscribed
- [ ] `expo-linking` opens URLs in native browser/app

---

## 🔗 Next: [10_PRACTICE_EXAM.md](./10_PRACTICE_EXAM.md)
