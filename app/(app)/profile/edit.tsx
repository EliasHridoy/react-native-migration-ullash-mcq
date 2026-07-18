import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/features/profile/store/profile.store';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';
import { GlassCard } from '@/components/GlassCard';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g. +880123456789)"
            placeholderTextColor={Colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </GlassCard>

        <GradientButton
          label="Save Changes"
          onPress={handleSave}
          loading={isSubmitting}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  backButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  backButtonText: { color: Colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 14 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  card: { padding: 20, gap: 16 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: -8 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
});
