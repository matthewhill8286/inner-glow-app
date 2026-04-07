import { create } from 'zustand';
import type { FreudBreakdown } from '@/lib/freudScore';

/* ------------------------------------------------------------------ */
/*  Suggestion Bonus Store                                             */
/*                                                                     */
/*  Tracks gamification bonus points earned from completing AI         */
/*  suggestions. This is a shared store so ALL useFreudScore() hook    */
/*  instances (detail screen, suggestions screen, home, etc.) see      */
/*  the same bonus value and re-render when it changes.                */
/* ------------------------------------------------------------------ */

interface SuggestionBonusState {
  scoreBonus: number;
  breakdownBonus: Partial<FreudBreakdown>;
  addBonus: (points: number, category?: keyof FreudBreakdown, metricBonus?: number) => void;
  reset: () => void;
}

export const useSuggestionBonusStore = create<SuggestionBonusState>()((set) => ({
  scoreBonus: 0,
  breakdownBonus: {},

  addBonus: (points, category, metricBonus) =>
    set((state) => ({
      scoreBonus: Math.min(100, state.scoreBonus + points),
      breakdownBonus: category && metricBonus
        ? {
            ...state.breakdownBonus,
            [category]: Math.min(100, (state.breakdownBonus[category] ?? 0) + metricBonus),
          }
        : state.breakdownBonus,
    })),

  reset: () => set({ scoreBonus: 0, breakdownBonus: {} }),
}));
