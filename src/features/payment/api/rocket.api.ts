import { supabase } from '@/core/supabase/client';
import { RocketTransaction, RocketCreatePaymentResult } from '../types/rocket.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const rocketApi = {
  /**
   * Step 1: Creates Rocket payment.
   * Edge Function: create → returns redirectUrl
   */
  async createPayment(planId: string, amount: number): Promise<RocketCreatePaymentResult> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.rocketPaymentFunction,
      {
        body: {
          action: 'create',
          plan_id: planId,
          amount: amount.toFixed(2),
        },
      }
    );
    if (error) throw error;
    if (!data?.paymentID) throw new Error('Failed to create Rocket payment');
    return {
      paymentId: data.paymentID,
      redirectUrl: data.redirectUrl,
    };
  },

  /**
   * Step 2: Executes/queries Rocket payment after user completes authorization.
   * Edge Function: execute → validate → upsert_rocket_payment RPC → upsert_subscription RPC
   */
  async executePayment(paymentId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.rocketPaymentFunction,
      {
        body: {
          action: 'execute',
          payment_id: paymentId,
        },
      }
    );
    if (error) throw error;
    if (data?.status !== 'Completed') {
      throw new Error(`Payment failed: ${data?.statusMessage ?? 'Unknown error'}`);
    }
  },

  /**
   * Fetch Rocket transaction history for current user.
   */
  async getTransactions(): Promise<RocketTransaction[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.rocketTransactionsTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string,
      planId: row.plan_id as string,
      amount: row.amount as number,
      currency: 'BDT' as const,
      paymentId: row.payment_id as string | undefined,
      transactionId: row.transaction_id as string | undefined,
      status: row.status as RocketTransaction['status'],
      statusLabel:
        row.status === 'completed'
          ? 'Completed'
          : row.status === 'failed'
            ? 'Failed'
            : 'Pending',
      amountDisplay: `৳${parseFloat(String(row.amount)).toFixed(2)}`,
      createdAt: row.created_at as string,
    }));
  },
};
