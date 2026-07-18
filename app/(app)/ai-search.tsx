import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShimmerLoader } from '@/components/ShimmerLoader';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { aiTutorApi, SemanticSearchResult } from '@/features/ai_tutor/api/ai-tutor.api';

const CHIPS = ["Newton's law", 'Bangladesh Constitution 7th amendment', 'Photosynthesis', 'Trigonometry'];
const ICONS: Record<string, string> = { pdf: '📄', video: '🎬', article: '📝', note: '📋' };

export default function AISearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); setHasSearched(false); return; }
    setIsLoading(true); setHasSearched(true);
    try { setResults(await aiTutorApi.semanticSearch(q.trim())); }
    catch { setResults([]); }
    finally { setIsLoading(false); }
  }, []);

  const onChange = useCallback((t: string) => {
    setQuery(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(t), 500);
  }, [search]);

  const clear = useCallback(() => {
    setQuery(''); setResults([]); setHasSearched(false);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backT}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.title}>AI Search</Text>
            <Text style={s.subtitle}>Semantic study material search</Text>
          </View>
        </View>

        <View style={s.bar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput style={s.input} placeholder="Search study materials..." placeholderTextColor={Colors.textMuted}
            value={query} onChangeText={onChange} autoFocus returnKeyType="search" onSubmitEditing={() => search(query)} />
          {query.length > 0 && (
            <TouchableOpacity onPress={clear} style={{ padding: 8 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {query.length === 0 && !hasSearched && (
          <View style={s.chipsWrap}>
            <Text style={s.chipsLabel}>Suggested Searches</Text>
            <View style={s.chips}>
              {CHIPS.map(c => (
                <TouchableOpacity key={c} style={s.chip} onPress={() => { setQuery(c); search(c); }}>
                  <Text style={s.chipT}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isLoading && (
          <View style={{ padding: 16, gap: 12 }}>
            {[1, 2, 3, 4].map(i => <ShimmerLoader key={i} height={110} borderRadius={12} />)}
          </View>
        )}

        {!isLoading && (
          <FlatList data={results} keyExtractor={i => i.materialId}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}
            renderItem={({ item }) => (
              <GlassCard>
                <View style={s.rHead}>
                  <View style={s.rTitleRow}>
                    <Text style={{ fontSize: 20 }}>{ICONS[item.materialType] ?? '📎'}</Text>
                    <Text style={s.rTitle} numberOfLines={2}>{item.title}</Text>
                  </View>
                  <View style={[s.simBadge, { borderColor: item.similarity >= 0.7 ? Colors.success : Colors.warning }]}>
                    <Text style={[s.simT, { color: item.similarity >= 0.7 ? Colors.success : Colors.warning }]}>
                      {Math.round(item.similarity * 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={s.excerpt} numberOfLines={3}>{item.excerpt}</Text>
                <View style={s.rFoot}>
                  <View style={s.typeBadge}><Text style={s.typeT}>{item.materialType.toUpperCase()}</Text></View>
                  <TouchableOpacity><Text style={s.openT}>Open →</Text></TouchableOpacity>
                </View>
              </GlassCard>
            )}
            ListEmptyComponent={hasSearched ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🤖</Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>No results</Text>
                <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>Try different keywords.</Text>
              </View>
            ) : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  back: { paddingRight: 16, paddingVertical: 4 },
  backT: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold' },
  title: { color: Colors.textPrimary, fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  subtitle: { color: Colors.textMuted, fontSize: 12 },
  bar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 8, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, height: 48, color: Colors.textPrimary, fontFamily: 'Inter_400Regular', fontSize: 15 },
  chipsWrap: { paddingHorizontal: 16, marginTop: 16 },
  chipsLabel: { color: Colors.textMuted, fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  chipT: { color: Colors.accent, fontSize: 13, fontFamily: 'Inter_500Medium' },
  rHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  rTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8, marginRight: 8 },
  rTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 20 },
  simBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  simT: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  excerpt: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  rFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  typeBadge: { backgroundColor: 'rgba(0,210,211,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  typeT: { color: Colors.accent, fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  openT: { color: Colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});
