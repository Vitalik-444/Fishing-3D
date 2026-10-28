import { create } from 'zustand';
import { canTransition, type CatchRecord, type FishInstance, type FishingState } from '../game/fishing/fishingTypes';
import { resetRuntime } from '../game/fishing/fishingRuntime';
import { BAIT_BY_ID } from '../game/data/baits';
import { EQUIPMENT_BY_ID } from '../game/data/equipment';
import { SPECIES_BY_ID } from '../game/data/fishSpecies';
import { applyXp } from '../game/progression';
import {
  MAX_BAIT_STOCK,
  MAX_RECENT,
  clearSave,
  defaultProfile,
  loadSave,
  writeSave,
  type Profile,
  type SpeciesRecord,
} from '../services/persistence';

export type Phase = 'menu' | 'playing' | 'paused';
export type { Profile };

export interface PendingCatch {
  fish: FishInstance;
  levelUp: number | null;
  newSpecies: boolean;
  newRecord: boolean;
}

export interface Banner {
  id: number;
  kind: 'escaped' | 'broken';
  text: string;
}

export type ToastKind = 'info' | 'reward' | 'level';

interface Toast { id: number; text: string; kind: ToastKind }

export interface ActionResult {
  ok: boolean;
  message: string;
}

interface GameStore {
  phase: Phase;
  fishingState: FishingState;
  retrieving: boolean;
  toast: Toast | null;
  banner: Banner | null;
  lockMessage: string | null;
  profile: Profile;
  hasSave: boolean;
  pendingCatch: PendingCatch | null;

  setPhase: (phase: Phase) => void;
  transition: (to: FishingState) => boolean;
  setRetrieving: (v: boolean) => void;
  notify: (text: string, kind?: ToastKind) => void;
  showBanner: (kind: Banner['kind'], text: string) => void;
  clearBanner: () => void;
  setLockMessage: (text: string | null) => void;
  resetFishing: () => void;
  leaveToMenu: () => void;

  startNewGame: () => void;
  buyItem: (id: string) => ActionResult;
  equipItem: (id: string) => ActionResult;
  buyBait: (id: string) => ActionResult;
  selectBait: (id: string) => ActionResult;
  consumeBait: () => boolean;
  recordCast: () => void;
  recordEscape: () => void;
  recordLineBreak: () => void;
  registerCatch: (fish: FishInstance) => PendingCatch | null;
  resolveCatch: (keep: boolean) => CatchRecord | null;
}

let toastId = 0;
let bannerId = 0;

const initial = loadSave();

const fail = (message: string): ActionResult => ({ ok: false, message });
const ok = (message: string): ActionResult => ({ ok: true, message });

export const useGameStore = create<GameStore>()((set, get) => ({
  phase: 'menu',
  fishingState: 'idle',
  retrieving: false,
  toast: null,
  banner: null,
  lockMessage: null,
  profile: initial.profile,
  hasSave: initial.existed,
  pendingCatch: null,

  setPhase: (phase) => set({ phase }),

  transition: (to) => {
    if (!canTransition(get().fishingState, to)) return false;
    set({ fishingState: to });
    return true;
  },

  setRetrieving: (retrieving) => set({ retrieving }),
  notify: (text, kind = 'info') => set({ toast: { id: ++toastId, text, kind } }),
  showBanner: (kind, text) => set({ banner: { id: ++bannerId, kind, text } }),
  clearBanner: () => set({ banner: null }),
  setLockMessage: (lockMessage) => set({ lockMessage }),

  resetFishing: () => {
    resetRuntime();
    set({ fishingState: 'idle', retrieving: false, toast: null, banner: null });
  },

  leaveToMenu: () => {
    if (get().pendingCatch) get().resolveCatch(true);
    get().resetFishing();
    set({ phase: 'menu' });
  },

  startNewGame: () => {
    clearSave();
    const profile = defaultProfile();
    writeSave(profile);
    resetRuntime();
    set({
      profile,
      hasSave: true,
      pendingCatch: null,
      fishingState: 'idle',
      retrieving: false,
      toast: null,
      banner: null,
    });
  },

  buyItem: (id) => {
    const item = EQUIPMENT_BY_ID[id];
    if (!item) return fail('Unknown item.');
    const { profile } = get();
    if (profile.owned[item.category].includes(id)) return fail('You already own this.');
    if (profile.level < item.unlockLevel) return fail(`Unlocks at level ${item.unlockLevel}.`);
    if (profile.money < item.price) return fail('Not enough money.');
    set({
      profile: {
        ...profile,
        money: profile.money - item.price,
        owned: { ...profile.owned, [item.category]: [...profile.owned[item.category], id] },
      },
    });
    return ok(`Bought ${item.name}.`);
  },

  equipItem: (id) => {
    const item = EQUIPMENT_BY_ID[id];
    if (!item) return fail('Unknown item.');
    const { profile } = get();
    if (!profile.owned[item.category].includes(id)) return fail('You do not own this yet.');
    if (profile.level < item.unlockLevel) return fail(`Unlocks at level ${item.unlockLevel}.`);
    if (profile.equipped[item.category] === id) return ok(`${item.name} is already equipped.`);
    set({ profile: { ...profile, equipped: { ...profile.equipped, [item.category]: id } } });
    return ok(`Equipped ${item.name}.`);
  },

  buyBait: (id) => {
    const bait = BAIT_BY_ID[id];
    if (!bait) return fail('Unknown bait.');
    const { profile } = get();
    if (profile.level < bait.unlockLevel) return fail(`Unlocks at level ${bait.unlockLevel}.`);
    const stock = profile.baitStock[id] ?? 0;
    if (bait.reusable && stock > 0) return fail('You already own this lure.');
    if (stock + bait.packSize > MAX_BAIT_STOCK) return fail('You cannot carry any more of this bait.');
    if (profile.money < bait.price) return fail('Not enough money.');
    set({
      profile: {
        ...profile,
        money: profile.money - bait.price,
        baitStock: { ...profile.baitStock, [id]: stock + bait.packSize },
      },
    });
    return ok(`Bought ${bait.packSize} × ${bait.name}.`);
  },

  selectBait: (id) => {
    const bait = BAIT_BY_ID[id];
    if (!bait) return fail('Unknown bait.');
    const { profile } = get();
    if ((profile.baitStock[id] ?? 0) <= 0) return fail('You have none of this bait.');
    if (profile.selectedBait === id) return ok(`${bait.name} is already selected.`);
    set({ profile: { ...profile, selectedBait: id } });
    return ok(`Selected ${bait.name}.`);
  },

  consumeBait: () => {
    const { profile } = get();
    const bait = BAIT_BY_ID[profile.selectedBait];
    if (!bait) return false;
    if (bait.reusable) return true;
    const stock = profile.baitStock[bait.id] ?? 0;
    if (stock <= 0) return false;
    const next = { ...profile.baitStock };
    if (stock - 1 > 0) next[bait.id] = stock - 1;
    else delete next[bait.id];
    set({ profile: { ...profile, baitStock: next } });
    return true;
  },

  recordCast: () => {
    const { profile } = get();
    set({ profile: { ...profile, stats: { ...profile.stats, casts: profile.stats.casts + 1 } } });
  },

  recordEscape: () => {
    const { profile } = get();
    set({ profile: { ...profile, stats: { ...profile.stats, escapes: profile.stats.escapes + 1 } } });
  },

  recordLineBreak: () => {
    const { profile } = get();
    set({ profile: { ...profile, stats: { ...profile.stats, lineBreaks: profile.stats.lineBreaks + 1 } } });
  },

  registerCatch: (fish) => {
    const state = get();
    if (state.pendingCatch) return null;
    const species = SPECIES_BY_ID[fish.speciesId];
    if (!species) return null;
    const { profile } = state;

    const prevRecord: SpeciesRecord | undefined = profile.species[fish.speciesId];
    const nextRecord: SpeciesRecord = {
      caught: (prevRecord?.caught ?? 0) + 1,
      largestWeight: Math.max(prevRecord?.largestWeight ?? 0, fish.weight),
      largestLength: Math.max(prevRecord?.largestLength ?? 0, fish.length),
      totalWeight: (prevRecord?.totalWeight ?? 0) + fish.weight,
      bestValue: Math.max(prevRecord?.bestValue ?? 0, fish.value),
    };
    const newSpecies = !prevRecord;
    const newRecord = !!prevRecord && fish.weight > prevRecord.largestWeight;

    const xp = applyXp(profile.level, profile.xp, fish.xp);
    const stats = { ...profile.stats };
    stats.totalCatches += 1;
    stats.totalWeight += fish.weight;
    if (fish.weight > stats.largestWeight) {
      stats.largestWeight = fish.weight;
      stats.largestSpeciesId = fish.speciesId;
    }
    if (fish.value > stats.bestValue) {
      stats.bestValue = fish.value;
      stats.bestSpeciesId = fish.speciesId;
    }

    const record: CatchRecord = { ...fish, time: Date.now(), kept: true };
    const pending: PendingCatch = {
      fish,
      levelUp: xp.levelsGained > 0 ? xp.level : null,
      newSpecies,
      newRecord,
    };

    set({
      pendingCatch: pending,
      profile: {
        ...profile,
        level: xp.level,
        xp: xp.xp,
        stats,
        species: { ...profile.species, [fish.speciesId]: nextRecord },
        recent: [record, ...profile.recent].slice(0, MAX_RECENT),
      },
    });
    return pending;
  },

  resolveCatch: (keep) => {
    const { pendingCatch, profile } = get();
    if (!pendingCatch) return null;
    const id = pendingCatch.fish.id;
    const stats = { ...profile.stats };
    let money = profile.money;
    if (keep) {
      money += pendingCatch.fish.value;
      stats.moneyEarned += pendingCatch.fish.value;
    } else {
      stats.released += 1;
    }
    const recent = profile.recent.map((r) => (r.id === id ? { ...r, kept: keep } : r));
    const record = recent.find((r) => r.id === id) ?? null;
    set({ pendingCatch: null, profile: { ...profile, money, stats, recent } });
    return record;
  },
}));

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function flushSave(): void {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const s = useGameStore.getState();
  if (s.hasSave) writeSave(s.profile);
}

useGameStore.subscribe((state, prev) => {
  if (state.profile === prev.profile) return;
  if (!state.hasSave) {
    useGameStore.setState({ hasSave: true });
    return;
  }
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 400);
});

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushSave();
  });
}
