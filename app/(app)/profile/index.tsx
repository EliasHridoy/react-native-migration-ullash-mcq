import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProfileStore } from '@/features/profile/store/profile.store';
import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { Colors } from '@/core/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { profile, loadProfile, uploadAvatar, status } = useProfileStore();

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id);
    }
  }, [user?.id]);

  const handlePickAvatar = async () => {
    // Request permission first
    const { status: permissionStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your photos to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Avatar */}
      <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {profile?.fullName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        {status === 'avatarUploading' && (
          <View style={styles.avatarOverlay}>
            <Text style={{ color: Colors.white, fontFamily: 'Inter_600SemiBold' }}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Profile Card */}
      <GlassCard style={styles.card}>
        <Text style={styles.name}>{profile?.fullName ?? '—'}</Text>
        <Text style={styles.email}>{profile?.email ?? '—'}</Text>
        {profile?.phone ? (
          <Text style={styles.phone}>{profile.phone}</Text>
        ) : null}
        <Text style={styles.tier}>
          Plan: <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold' }}>{profile?.subscriptionTier ?? 'Free'}</Text>
        </Text>
      </GlassCard>

      {/* Actions */}
      <GradientButton
        label="Edit Profile"
        onPress={() => router.push('/(app)/profile/edit' as any)}
        style={{ marginTop: 16 }}
      />
      <GradientButton
        label="Sign Out"
        onPress={handleSignOut}
        variant="danger"
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 24 },
  avatarContainer: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, color: Colors.white, fontFamily: 'Inter_700Bold' },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 16, padding: 20 },
  name: { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 4 },
  email: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 8 },
  phone: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 8 },
  tier: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
