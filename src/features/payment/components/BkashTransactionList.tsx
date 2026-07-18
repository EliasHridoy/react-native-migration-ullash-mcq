import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { bkashApi } from '../api/bkash.api';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/core/theme/colors';
import { BkashTransaction } from '../types/bkash.types';

export function BkashTransactionList() {
  const {
    data: transactions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['bkash-transactions'],
    queryFn: bkashApi.getTransactions,
  });

  const renderItem = ({ item }: { item: BkashTransaction }) => (
    <GlassCard style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.amount}>{item.amountDisplay}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
      <Text
        style={[
          styles.statusLabel,
          { color: item.status === 'completed' ? Colors.success : Colors.error },
        ]}
      >
        {item.statusLabel}
      </Text>
    </GlassCard>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="small" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Failed to load transactions</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        scrollEnabled={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLeft: {
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  statusLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  centered: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    padding: 16,
    fontFamily: 'Inter_400Regular',
  },
});
