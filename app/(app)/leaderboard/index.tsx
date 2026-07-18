import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLeaderboardStore } from '@/features/leaderboard/store/leaderboard.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GlassCard } from '@/components/GlassCard';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { Colors } from '@/core/theme/colors';
import { Typography } from '@/core/theme/typography';
import { Spacing, BorderRadius } from '@/core/theme/spacing';
import { LeaderboardEntry } from '@/features/leaderboard/types/leaderboard.types';

const PODIUM_COLORS = ['#BDC3C7', '#F1C40F', '#E67E22']; // Silver, Gold, Bronze

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const store = useLeaderboardStore();

  useEffect(() => {
    store.loadGlobal();
    const unsubscribe = store.subscribeToRealtime();
    return unsubscribe;
  }, []);

  const entries = store.activeTab === 'global' ? store.globalEntries : store.examEntries;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const handleExamSelect = (examId: string) => {
    store.loadExam(examId);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, Typography.headlineLarge]}>🏆 Leaderboard</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {(['global', 'exam'] as const).map((tab) => {
            const isActive = store.activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => store.setTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    Typography.labelLarge,
                    isActive ? styles.activeTabText : styles.inactiveTabText,
                  ]}
                >
                  {tab === 'global' ? 'Global Rankings' : 'Exam Rankings'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Exam Selector Chips */}
      {store.activeTab === 'exam' && store.recentExams.length > 0 && (
        <View style={styles.examSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examChipsScrollContent}
          >
            {store.recentExams.map((exam) => {
              const isSelected = exam.id === store.currentExamId;
              return (
                <TouchableOpacity
                  key={exam.id}
                  onPress={() => handleExamSelect(exam.id)}
                  style={[
                    styles.examChip,
                    isSelected ? styles.examChipSelected : styles.examChipUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.examChipText,
                      Typography.labelMedium,
                      isSelected ? styles.examChipTextSelected : styles.examChipTextUnselected,
                    ]}
                  >
                    {exam.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      {store.activeTab === 'exam' ? (
        <SubscriptionGate featureName="Exam Leaderboard & Statistics">
          <FlatList
            data={rest}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              top3.length > 0 ? (
                <View style={styles.listHeader}>
                  <Podium entries={top3} />
                  <Text style={[styles.sectionTitle, Typography.headlineSmall]}>Rankings</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !store.isLoading ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, Typography.bodyMedium]}>
                    No submissions yet for this exam. Be the first to rank!
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <RankRow entry={item} isCurrentUser={item.userId === user?.id} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={store.isLoading}
                onRefresh={() => store.currentExamId && store.loadExam(store.currentExamId)}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        </SubscriptionGate>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            top3.length > 0 ? (
              <View style={styles.listHeader}>
                <Podium entries={top3} />
                <Text style={[styles.sectionTitle, Typography.headlineSmall]}>Top Performers</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !store.isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, Typography.bodyMedium]}>
                  No entries registered yet. Start submitting exams to get ranked!
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <RankRow entry={item} isCurrentUser={item.userId === user?.id} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={store.isLoading}
              onRefresh={() => store.loadGlobal()}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <View style={styles.podiumWrapper}>
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        <View style={styles.podiumColumn}>
          {second ? (
            <>
              <View style={[styles.avatarContainer, { borderColor: PODIUM_COLORS[0] }]}>
                {second.avatarUrl ? (
                  <Image source={{ uri: second.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, Typography.headlineSmall]}>
                    {getInitials(second.displayName)}
                  </Text>
                )}
                <View style={[styles.rankBadge, { backgroundColor: PODIUM_COLORS[0] }]}>
                  <Text style={styles.rankBadgeText}>#2</Text>
                </View>
              </View>
              <Text style={[styles.podiumName, Typography.bodySmall]} numberOfLines={1}>
                {second.displayName}
              </Text>
              <Text style={[styles.podiumScore, Typography.bodySmall]}>
                {second.score.toFixed(1)} pts
              </Text>
              <LinearGradient
                colors={['rgba(189, 195, 199, 0.3)', 'rgba(189, 195, 199, 0.05)']}
                style={[styles.podiumPedestal, { height: 60 }]}
              />
            </>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>

        {/* 1st Place */}
        <View style={styles.podiumColumn}>
          {first ? (
            <>
              <View style={[styles.avatarContainer, styles.avatarContainerFirst, { borderColor: PODIUM_COLORS[1] }]}>
                <Text style={styles.crownIcon}>👑</Text>
                {first.avatarUrl ? (
                  <Image source={{ uri: first.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, Typography.headlineMedium, { color: Colors.warning }]}>
                    {getInitials(first.displayName)}
                  </Text>
                )}
                <View style={[styles.rankBadge, { backgroundColor: PODIUM_COLORS[1] }]}>
                  <Text style={styles.rankBadgeText}>#1</Text>
                </View>
              </View>
              <Text style={[styles.podiumName, Typography.bodyMedium, { fontWeight: 'bold' }]} numberOfLines={1}>
                {first.displayName}
              </Text>
              <Text style={[styles.podiumScore, Typography.bodyMedium, { color: Colors.primaryLight, fontWeight: '700' }]}>
                {first.score.toFixed(1)} pts
              </Text>
              <LinearGradient
                colors={['rgba(241, 196, 15, 0.35)', 'rgba(241, 196, 15, 0.05)']}
                style={[styles.podiumPedestal, { height: 90 }]}
              />
            </>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>

        {/* 3rd Place */}
        <View style={styles.podiumColumn}>
          {third ? (
            <>
              <View style={[styles.avatarContainer, { borderColor: PODIUM_COLORS[2] }]}>
                {third.avatarUrl ? (
                  <Image source={{ uri: third.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, Typography.headlineSmall]}>
                    {getInitials(third.displayName)}
                  </Text>
                )}
                <View style={[styles.rankBadge, { backgroundColor: PODIUM_COLORS[2] }]}>
                  <Text style={styles.rankBadgeText}>#3</Text>
                </View>
              </View>
              <Text style={[styles.podiumName, Typography.bodySmall]} numberOfLines={1}>
                {third.displayName}
              </Text>
              <Text style={[styles.podiumScore, Typography.bodySmall]}>
                {third.score.toFixed(1)} pts
              </Text>
              <LinearGradient
                colors={['rgba(230, 126, 34, 0.25)', 'rgba(230, 126, 34, 0.05)']}
                style={[styles.podiumPedestal, { height: 40 }]}
              />
            </>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      </View>
    </View>
  );
}

function RankRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  const getInitials = (name: string) => {
    return name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <GlassCard style={StyleSheet.flatten([styles.rankRow, isCurrentUser && styles.currentUserRow])}>
      <View style={styles.rankRowInner}>
        {/* Rank Badge */}
        <Text style={[styles.rankNum, Typography.headlineSmall, isCurrentUser && { color: Colors.primaryLight }]}>
          #{entry.rank}
        </Text>

        {/* User Avatar */}
        <View style={styles.rowAvatar}>
          {entry.avatarUrl ? (
            <Image source={{ uri: entry.avatarUrl }} style={styles.rowAvatarImage} />
          ) : (
            <Text style={[styles.rowAvatarText, Typography.labelSmall]}>
              {getInitials(entry.displayName)}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.rankInfo}>
          <Text style={[styles.rankName, Typography.bodyMedium, isCurrentUser && { fontWeight: 'bold' }]} numberOfLines={1}>
            {entry.displayName}
          </Text>
          <Text style={[styles.rankSubText, Typography.bodySmall]}>
            {entry.examId ? `Snapshot Rank` : `Active candidate`}
          </Text>
        </View>

        {/* User Score */}
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.rankScore,
              Typography.headlineSmall,
              isCurrentUser ? { color: Colors.accent } : { color: Colors.primaryLight }
            ]}
          >
            {entry.score.toFixed(1)}
          </Text>
          <Text style={[styles.ptsText, Typography.labelSmall]}>pts</Text>
        </View>

        {isCurrentUser && (
          <View style={styles.youBadge}>
            <Text style={[styles.youText, Typography.labelSmall]}>YOU</Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
  },
  activeTabText: {
    color: Colors.white,
  },
  inactiveTabText: {
    color: Colors.textMuted,
  },
  examSelectorContainer: {
    marginBottom: Spacing.md,
  },
  examChipsScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  examChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  examChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  examChipUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  examChipText: {
    fontFamily: 'Inter_500Medium',
  },
  examChipTextSelected: {
    color: Colors.white,
  },
  examChipTextUnselected: {
    color: Colors.textSecondary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rankRow: {
    marginBottom: Spacing.sm,
  },
  rankRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserRow: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  rankNum: {
    color: Colors.textSecondary,
    width: 36,
    textAlign: 'center',
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  rowAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
  },
  rowAvatarText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    color: Colors.textPrimary,
  },
  rankSubText: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rankScore: {
    fontWeight: '800',
  },
  ptsText: {
    color: Colors.textMuted,
    marginTop: -2,
  },
  youBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: BorderRadius.sm,
  },
  youText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Podium specific styling
  podiumWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarContainerFirst: {
    width: 60,
    height: 60,
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  avatarText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  crownIcon: {
    position: 'absolute',
    top: -20,
    fontSize: 18,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -8,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankBadgeText: {
    color: Colors.black,
    fontWeight: '800',
    fontSize: 9,
  },
  podiumName: {
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    width: '90%',
  },
  podiumScore: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  podiumPedestal: {
    width: '80%',
    borderRadius: BorderRadius.sm,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
  },
});
