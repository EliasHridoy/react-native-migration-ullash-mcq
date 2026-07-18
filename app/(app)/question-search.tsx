import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuestionSearch } from '@/features/exam/hooks/useQuestionSearch';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ShimmerLoader } from '@/components/ShimmerLoader';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';

const SUGGESTION_CHIPS = ["Newton's law", 'photosynthesis', 'quadratic equation', 'Bangladesh Constitution'];

export default function QuestionSearchScreen() {
  const { rawQuery, setQuery, clearSearch, results, isLoading } = useQuestionSearch();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Question Search</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.input}
            placeholder="Search questions..."
            placeholderTextColor={Colors.textMuted}
            value={rawQuery}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {rawQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestion Chips */}
        {rawQuery.length === 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Popular Searches</Text>
            <View style={styles.chips}>
              {SUGGESTION_CHIPS.map(chip => (
                <TouchableOpacity key={chip} style={styles.chip} onPress={() => setQuery(chip)}>
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Characters count warning */}
        {rawQuery.length === 1 && (
          <View style={styles.infoState}>
            <Text style={{ color: Colors.textMuted }}>Type at least 2 characters to search...</Text>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={{ padding: 16, gap: 12 }}>
            {[1, 2, 3].map(i => (
              <ShimmerLoader key={i} height={120} borderRadius={12} />
            ))}
          </View>
        )}

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={q => q.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}
          renderItem={({ item, index }) => (
            <GlassCard>
              <View style={styles.resultHeader}>
                <Text style={styles.qNum}>Question #{index + 1}</Text>
                <DifficultyBadge level={item.difficultyLevel} />
              </View>
              <Text style={styles.questionText}>{item.text}</Text>
              
              {/* Show options with correct highlighted */}
              <View style={styles.optionsContainer}>
                {(item.options ?? []).slice(0, 4).map((opt) => (
                  <View key={opt.id} style={[styles.option, opt.isCorrect && styles.correctOption]}>
                    <Text style={[styles.optionText, opt.isCorrect && styles.correctText]}>
                      {opt.isCorrect ? '✓ ' : '  '}{opt.optionText}
                    </Text>
                  </View>
                ))}
              </View>

              {item.explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationTitle}>Explanation:</Text>
                  <Text style={styles.explanationText}>{item.explanation}</Text>
                </View>
              )}
            </GlassCard>
          )}
          ListEmptyComponent={rawQuery.length >= 2 && !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>No results for "{rawQuery}"</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 4 }}>Try a different keyword or topic.</Text>
            </View>
          ) : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    paddingRight: 16,
    paddingVertical: 4,
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  clearBtn: { padding: 8 },
  suggestionsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  suggestionsTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.primary, fontSize: 13, fontFamily: 'Inter_500Medium' },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qNum: { color: Colors.textMuted, fontSize: 12, fontFamily: 'Inter_500Medium' },
  questionText: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_500Medium',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 6,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  optionText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular' },
  correctOption: {
    backgroundColor: 'rgba(81, 207, 102, 0.08)',
    borderColor: 'rgba(81, 207, 102, 0.3)',
  },
  correctText: { color: Colors.success, fontFamily: 'Inter_600SemiBold' },
  explanationBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  explanationTitle: {
    color: Colors.accent,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  explanationText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  infoState: {
    alignItems: 'center',
    padding: 16,
  },
  emptyState: { alignItems: 'center', padding: 40 },
});
