import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { Spacing, BorderRadius } from '@/core/theme/spacing';
import { RocketTransaction } from '../types/rocket.types';

interface RocketTransactionListProps {
  transactions: RocketTransaction[];
  loading?: boolean;
}

const statusColors: Record<RocketTransaction['status'], string> = {
  completed: Colors.success,
  pending: Colors.warning,
  failed: Colors.error,
};

export function RocketTransactionList({ transactions, loading }: RocketTransactionListProps) {
  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading transactions…</Text>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <GlassCard style={styles.txCard}>
          <View style={styles.txRow}>
            <View style={styles.txInfo}>
              <Text style={styles.txPlan}>Plan: {item.planId}</Text>
              <Text style={styles.txDate}>
                {new Date(item.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              {item.transactionId && (
                <Text style={styles.txId}>TxnID: {item.transactionId}</Text>
              )}
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txAmount}>{item.amountDisplay}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status]}20` }]}>
                <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                  {item.statusLabel}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: Spacing.sm,
  },
  txCard: {
    padding: Spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  txPlan: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  txDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txId: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
});
