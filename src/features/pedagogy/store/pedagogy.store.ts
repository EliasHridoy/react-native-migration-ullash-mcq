import { create } from 'zustand';
import { WeaknessGap, MicroPractice, pedagogyApi } from '../api/pedagogy.api';

interface PedagogyState {
  weaknessGaps: WeaknessGap[];
  microPractices: MicroPractice[];
  loadingGaps: boolean;
  loadingPractices: boolean;
  error: string | null;
}

interface PedagogyActions {
  fetchWeaknessGaps: (userId: string) => Promise<void>;
  fetchPendingPractices: (userId: string) => Promise<void>;
  markPracticeComplete: (practiceId: string, score: number) => Promise<void>;
  reset: () => void;
}

const initialState: PedagogyState = {
  weaknessGaps: [],
  microPractices: [],
  loadingGaps: false,
  loadingPractices: false,
  error: null,
};

export const usePedagogyStore = create<PedagogyState & PedagogyActions>((set, get) => ({
  ...initialState,

  fetchWeaknessGaps: async (userId: string) => {
    set({ loadingGaps: true, error: null });
    try {
      const gaps = await pedagogyApi.getWeaknessGaps(userId);
      set({ weaknessGaps: gaps, loadingGaps: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load weakness gaps';
      set({ error: message, loadingGaps: false });
    }
  },

  fetchPendingPractices: async (userId: string) => {
    set({ loadingPractices: true, error: null });
    try {
      const practices = await pedagogyApi.getPendingMicroPractices(userId);
      set({ microPractices: practices, loadingPractices: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load practices';
      set({ error: message, loadingPractices: false });
    }
  },

  markPracticeComplete: async (practiceId: string, score: number) => {
    try {
      await pedagogyApi.markMicroPracticeComplete(practiceId, score);
      const { microPractices } = get();
      set({
        microPractices: microPractices.filter(p => p.id !== practiceId),
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to complete practice';
      set({ error: message });
    }
  },

  reset: () => set(initialState),
}));
