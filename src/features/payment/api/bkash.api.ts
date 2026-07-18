import { supabase } from '@/core/supabase/client';
import { BkashTransaction, CreatePaymentResult } from '../types/bkash.types';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

export const bkashApi = {
  /**
   * Step 1: Creates bKash payment.
   * Edge Function: grantToken → createPayment → returns bkashURL
   */
  async createPayment(planId: string, amount: number): Promise<CreatePaymentResult> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.bkashPaymentFunction,
      {
        body: {
          action: 'create',
          plan_id: planId,
          amount: amount.toFixed(2),
        },
      }
    );
    if (error) throw error;
    if (!data?.paymentID) throw new Error('Failed to create bKash payment');
    return {
      paymentId: data.paymentID,
      bkashUrl: data.bkashURL,
      merchantInvoiceNumber: data.merchantInvoiceNumber,
    };
  },

  /**
   * Step 3: Executes bKash payment after user completes PIN entry.
   * Edge Function: executePayment → IPN validation → upsert_bkash_payment RPC → upsert_subscription RPC
   */
  async executePayment(paymentId: string, merchantInvoiceNumber: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      SupabaseConstants.bkashPaymentFunction,
      {
        body: {
          action: 'execute',
          payment_id: paymentId,
          merchant_invoice_number: merchantInvoiceNumber,
        },
      }
    );
    if (error) throw error;
    if (data?.status !== 'Completed') {
      throw new Error(`Payment failed: ${data?.statusMessage ?? 'Unknown error'}`);
    }
  },

  /**
   * Fetch transaction history for current user.
   */
  async getTransactions(): Promise<BkashTransaction[]> {
    const { data, error } = await supabase.rpc(SupabaseConstants.rpcGetBkashTransactions);
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string,
      planId: row.plan_id as string,
      amount: row.amount as number,
      currency: 'BDT' as const,
      paymentId: row.payment_id as string | undefined,
      merchantInvoiceNumber: row.merchant_invoice_number as string | undefined,
      trxId: row.trx_id as string | undefined,
      status: row.status as BkashTransaction['status'],
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
