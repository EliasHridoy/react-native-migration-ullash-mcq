import { create } from 'zustand';
import { RocketPaymentStatus, RocketCreatePaymentResult } from '../types/rocket.types';
import { rocketApi } from '../api/rocket.api';

interface RocketPaymentState {
  status: RocketPaymentStatus;
  paymentResult: RocketCreatePaymentResult | null;
  error: string | null;
}

interface RocketPaymentActions {
  initializePayment: (planId: string, amount: number) => Promise<string>; // Returns redirectUrl
  executePayment: () => Promise<void>;
  reset: () => void;
}

export const useRocketPaymentStore = create<RocketPaymentState & RocketPaymentActions>(
  (set, get) => ({
    status: 'idle',
    paymentResult: null,
    error: null,

    initializePayment: async (planId, amount) => {
      set({ status: 'initiating', error: null });
      try {
        const result = await rocketApi.createPayment(planId, amount);
        set({
          status: 'awaitingUserAction',
          paymentResult: result,
        });
        return result.redirectUrl;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Rocket payment initialization failed';
        set({ status: 'failed', error: message });
        throw e;
      }
    },

    executePayment: async () => {
      const { paymentResult } = get();
      if (!paymentResult) return;

      set({ status: 'executing' });
      try {
        await rocketApi.executePayment(paymentResult.paymentId);
        set({ status: 'completed', error: null });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Rocket payment execution failed';
        set({ status: 'failed', error: message });
      }
    },

    reset: () =>
      set({ status: 'idle', paymentResult: null, error: null }),
  })
);
