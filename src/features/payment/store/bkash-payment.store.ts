import { create } from 'zustand';
import { BkashPaymentStatus, CreatePaymentResult } from '../types/bkash.types';
import { bkashApi } from '../api/bkash.api';

interface BkashPaymentState {
  status: BkashPaymentStatus;
  paymentResult: CreatePaymentResult | null;
  error: string | null;
  invoiceNumber: string | null;
}

interface BkashPaymentActions {
  initializePayment: (planId: string, amount: number) => Promise<string>; // Returns bkashUrl
  executePayment: () => Promise<void>;
  reset: () => void;
}

export const useBkashPaymentStore = create<BkashPaymentState & BkashPaymentActions>(
  (set, get) => ({
    status: 'idle',
    paymentResult: null,
    error: null,
    invoiceNumber: null,

    initializePayment: async (planId, amount) => {
      set({ status: 'initiating', error: null });
      try {
        const result = await bkashApi.createPayment(planId, amount);
        set({
          status: 'awaitingUserAction',
          paymentResult: result,
          invoiceNumber: result.merchantInvoiceNumber,
        });
        return result.bkashUrl;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Payment initialization failed';
        set({ status: 'failed', error: message });
        throw e;
      }
    },

    executePayment: async () => {
      const { paymentResult } = get();
      if (!paymentResult) return;

      set({ status: 'executing' });
      try {
        await bkashApi.executePayment(
          paymentResult.paymentId,
          paymentResult.merchantInvoiceNumber
        );
        set({ status: 'completed', error: null });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Payment execution failed';
        set({ status: 'failed', error: message });
      }
    },

    reset: () =>
      set({ status: 'idle', paymentResult: null, error: null, invoiceNumber: null }),
  })
);
