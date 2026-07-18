import { create } from 'zustand';
import { NagadPaymentStatus, NagadCreatePaymentResult } from '../types/nagad.types';
import { nagadApi } from '../api/nagad.api';

interface NagadPaymentState {
  status: NagadPaymentStatus;
  paymentResult: NagadCreatePaymentResult | null;
  error: string | null;
}

interface NagadPaymentActions {
  initializePayment: (planId: string, amount: number) => Promise<string>; // Returns callbackUrl
  executePayment: () => Promise<void>;
  reset: () => void;
}

export const useNagadPaymentStore = create<NagadPaymentState & NagadPaymentActions>(
  (set, get) => ({
    status: 'idle',
    paymentResult: null,
    error: null,

    initializePayment: async (planId, amount) => {
      set({ status: 'initiating', error: null });
      try {
        const result = await nagadApi.createPayment(planId, amount);
        set({
          status: 'awaitingUserAction',
          paymentResult: result,
        });
        return result.callbackUrl;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Nagad payment initialization failed';
        set({ status: 'failed', error: message });
        throw e;
      }
    },

    executePayment: async () => {
      const { paymentResult } = get();
      if (!paymentResult) return;

      set({ status: 'executing' });
      try {
        await nagadApi.executePayment(paymentResult.paymentId);
        set({ status: 'completed', error: null });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Nagad payment execution failed';
        set({ status: 'failed', error: message });
      }
    },

    reset: () =>
      set({ status: 'idle', paymentResult: null, error: null }),
  })
);
