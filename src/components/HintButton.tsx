import React, { useCallback, useRef, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Colors } from '@/core/theme/colors';
import { aiTutorApi, HintResponse } from '@/features/ai_tutor/api/ai-tutor.api';
import { AppConstants } from '@/core/constants/app.constants';

interface HintButtonProps {
  questionId: string;
  questionText: string;
  selectedOptionText?: string;
  disabled?: boolean; // true in Live Exam
  userId: string;
}

export function HintButton({ questionId, questionText, selectedOptionText, disabled, userId }: HintButtonProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const openSheet = useCallback(() => bottomSheetRef.current?.expand(), []);

  const getNextHint = useCallback(async () => {
    if (hintsUsed >= AppConstants.maxHintsPerQuestion) return;
    setLoading(true);
    try {
      const response = await aiTutorApi.getHint({
        questionId,
        questionText,
        userSelectedOptionText: selectedOptionText,
        hintDepth: (hintsUsed + 1) as 1 | 2 | 3,
      });
      setHints(prev => [...prev, response]);
      setHintsUsed(prev => prev + 1);
    } catch (e) {
      console.error('Hint error:', e);
    } finally {
      setLoading(false);
    }
  }, [hintsUsed, questionId, questionText, selectedOptionText]);

  if (disabled) {
    return (
      <TouchableOpacity style={[styles.btn, styles.disabledBtn]} disabled>
        <Text style={styles.disabledText}>💡 Hints disabled in Live Exam</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => {
          openSheet();
          if (hints.length === 0) getNextHint();
        }}
      >
        <Text style={styles.btnText}>💡 Get Hint ({AppConstants.maxHintsPerQuestion - hintsUsed} left)</Text>
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '80%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: Colors.surface }}
        handleIndicatorStyle={{ backgroundColor: Colors.textMuted }}
      >
        <BottomSheetView style={styles.sheet}>
          <Text style={styles.sheetTitle}>AI Mitro — Socratic Hints</Text>
          <Text style={styles.sheetSubtitle}>Hints guide you conceptually without revealing the answer</Text>

          {hints.map((h, i) => (
            <View key={i} style={styles.hintCard}>
              <Text style={styles.hintDepth}>Hint {h.hintDepth}</Text>
              <Text style={styles.hintText}>{h.hint}</Text>
            </View>
          ))}

          {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />}

          {!loading && hintsUsed < AppConstants.maxHintsPerQuestion && (
            <TouchableOpacity style={styles.nextHintBtn} onPress={getNextHint}>
              <Text style={styles.nextHintText}>Get Deeper Hint →</Text>
            </TouchableOpacity>
          )}
          {hintsUsed >= AppConstants.maxHintsPerQuestion && (
            <Text style={styles.limitText}>Maximum hints reached for this question.</Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108,92,231,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    color: Colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  disabledBtn: {
    backgroundColor: 'rgba(107,111,138,0.1)',
    borderColor: 'transparent',
  },
  disabledText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  sheet: {
    padding: 20,
    flex: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  hintCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  hintDepth: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  nextHintBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  nextHintText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  limitText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
});
