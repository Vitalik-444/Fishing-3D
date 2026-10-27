import { create } from 'zustand';
import { canTransition, type FishingState } from '../game/fishing/fishingTypes';
import { resetRuntime } from '../game/fishing/fishingRuntime';
import { STARTER_BAIT, STARTER_ROD } from '../game/fishing/fishingConfig';

export type Phase = 'menu' | 'playing' | 'paused';

export interface Profile {
  level: number;
  money: number;
  rodName: string;
  baitName: string;
  baitCount: number;
}

interface Toast { id: number; text: string }

interface GameStore {
  phase: Phase;
  fishingState: FishingState;
  retrieving: boolean;
  toast: Toast | null;
  lockMessage: string | null;
  profile: Profile; // placeholder profile; Milestone 3 replaces it with the persisted player save

  setPhase: (phase: Phase) => void;
  /** Validated state change. Returns false (and changes nothing) for an illegal transition. */
  transition: (to: FishingState) => boolean;
  setRetrieving: (v: boolean) => void;
  notify: (text: string) => void;
  setLockMessage: (text: string | null) => void;
  resetFishing: () => void;
}

let toastId = 0;

export const useGameStore = create<GameStore>()((set, get) => ({
  phase: 'menu',
  fishingState: 'idle',
  retrieving: false,
  toast: null,
  lockMessage: null,
  profile: {
    level: 1,
    money: 100,
    rodName: STARTER_ROD.name,
    baitName: STARTER_BAIT.name,
    baitCount: STARTER_BAIT.count,
  },

  setPhase: (phase) => set({ phase }),

  transition: (to) => {
    if (!canTransition(get().fishingState, to)) return false;
    set({ fishingState: to });
    return true;
  },

  setRetrieving: (retrieving) => set({ retrieving }),
  notify: (text) => set({ toast: { id: ++toastId, text } }),
  setLockMessage: (lockMessage) => set({ lockMessage }),

  resetFishing: () => {
    resetRuntime();
    set({ fishingState: 'idle', retrieving: false, toast: null });
  },
}));
