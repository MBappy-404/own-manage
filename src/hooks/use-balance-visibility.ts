import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BalanceVisibilityState {
  isVisible: boolean;
  toggleVisibility: () => void;
}

export const useBalanceVisibility = create<BalanceVisibilityState>()(
  persist(
    (set) => ({
      isVisible: true,
      toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
    }),
    {
      name: "balance-visibility",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
