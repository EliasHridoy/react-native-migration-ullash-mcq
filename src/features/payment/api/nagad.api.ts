import { supabase } from '@/core/supabase/client';
import { NagadTransaction, NagadCreatePaymentResult } from '../types/nagad.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const nagadApi = {
  /**
   * Step 1: Initializes Nagad payment order.
   * Edge Function: create → RSA-signed init → returns callbackUrl
   */
  async createPayment(planId: string, amount: number): Promise<NagadCreatePaymentResult> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.nagadPaymentFunction,
      {
        body: {
          action: 'create',
          plan_id: planId,
          amount: amount.toFixed(2),
        },
      }
    );
    if (error) throw error;
    if (!data?.paymentID) throw new Error('Failed to create Nagad payment');
    return {
      paymentId: data.paymentID,
      callbackUrl: data.callbackUrl,
    };
  },

  /**
   * Step 2: Verifies Nagad payment after user completes authorization.
   * Edge Function: execute → verify signature → upsert_nagad_payment RPC → upsert_subscription RPC
   */
  async executePayment(paymentId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.nagadPaymentFunction,
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
   * Fetch Nagad transaction history for current user.
   */
  async getTransactions(): Promise<NagadTransaction[]> {
    const { data, error } = await supabase
      .from(SupabaseConstants.nagadTransactionsTable)
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
      status: row.status as NagadTransaction['status'],
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
