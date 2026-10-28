import { BAIT_BY_ID, isBaitId } from '../game/data/baits';
import { EQUIPMENT_BY_ID, EQUIPMENT_CATEGORIES, STARTER_EQUIPMENT, type EquipmentCategory } from '../game/data/equipment';
import { SPECIES_BY_ID } from '../game/data/fishSpecies';
import { STARTER_BAIT_ID, STARTER_BAIT_STOCK } from '../game/fishing/fishingConfig';
import { MAX_LEVEL, STARTING_MONEY, xpForLevel } from '../game/progression';
import type { CatchRecord } from '../game/fishing/fishingTypes';

export const SAVE_KEY = 'lakeside-angler:save';
export const SAVE_VERSION = 1;
export const MAX_RECENT = 30;
export const MAX_BAIT_STOCK = 99;

export interface SpeciesRecord {
  caught: number;
  largestWeight: number;
  largestLength: number;
  totalWeight: number;
  bestValue: number;
}

export interface Stats {
  totalCatches: number;
  totalWeight: number;
  released: number;
  casts: number;
  escapes: number;
  lineBreaks: number;
  moneyEarned: number;
  largestSpeciesId: string | null;
  largestWeight: number;
  bestSpeciesId: string | null;
  bestValue: number;
}

export interface Profile {
  level: number;
  xp: number;
  money: number;
  owned: Record<EquipmentCategory, string[]>;
  equipped: Record<EquipmentCategory, string>;
  baitStock: Record<string, number>;
  selectedBait: string;
  stats: Stats;
  species: Record<string, SpeciesRecord>;
  recent: CatchRecord[];
}

export function emptyStats(): Stats {
  return {
    totalCatches: 0,
    totalWeight: 0,
    released: 0,
    casts: 0,
    escapes: 0,
    lineBreaks: 0,
    moneyEarned: 0,
    largestSpeciesId: null,
    largestWeight: 0,
    bestSpeciesId: null,
    bestValue: 0,
  };
}

export function defaultProfile(): Profile {
  return {
    level: 1,
    xp: 0,
    money: STARTING_MONEY,
    owned: {
      rod: [STARTER_EQUIPMENT.rod],
      reel: [STARTER_EQUIPMENT.reel],
      line: [STARTER_EQUIPMENT.line],
      hook: [STARTER_EQUIPMENT.hook],
    },
    equipped: { ...STARTER_EQUIPMENT },
    baitStock: { ...STARTER_BAIT_STOCK },
    selectedBait: STARTER_BAIT_ID,
    stats: emptyStats(),
    species: {},
    recent: [],
  };
}

const num = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

const int = (v: unknown, min: number, max: number, fallback: number): number => Math.round(num(v, min, max, fallback));

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function sanitizeStats(raw: unknown): Stats {
  const d = emptyStats();
  if (!isObj(raw)) return d;
  const largestId = typeof raw.largestSpeciesId === 'string' && raw.largestSpeciesId in SPECIES_BY_ID ? raw.largestSpeciesId : null;
  const bestId = typeof raw.bestSpeciesId === 'string' && raw.bestSpeciesId in SPECIES_BY_ID ? raw.bestSpeciesId : null;
  return {
    totalCatches: int(raw.totalCatches, 0, 1e9, 0),
    totalWeight: num(raw.totalWeight, 0, 1e9, 0),
    released: int(raw.released, 0, 1e9, 0),
    casts: int(raw.casts, 0, 1e9, 0),
    escapes: int(raw.escapes, 0, 1e9, 0),
    lineBreaks: int(raw.lineBreaks, 0, 1e9, 0),
    moneyEarned: int(raw.moneyEarned, 0, 1e12, 0),
    largestSpeciesId: largestId,
    largestWeight: largestId ? num(raw.largestWeight, 0, 1e6, 0) : 0,
    bestSpeciesId: bestId,
    bestValue: bestId ? int(raw.bestValue, 0, 1e9, 0) : 0,
  };
}

function sanitizeSpecies(raw: unknown): Record<string, SpeciesRecord> {
  const out: Record<string, SpeciesRecord> = {};
  if (!isObj(raw)) return out;
  for (const id of Object.keys(SPECIES_BY_ID)) {
    const r = raw[id];
    if (!isObj(r)) continue;
    const caught = int(r.caught, 0, 1e9, 0);
    if (caught <= 0) continue;
    out[id] = {
      caught,
      largestWeight: num(r.largestWeight, 0, 1e6, 0),
      largestLength: num(r.largestLength, 0, 1e5, 0),
      totalWeight: num(r.totalWeight, 0, 1e9, 0),
      bestValue: int(r.bestValue, 0, 1e9, 0),
    };
  }
  return out;
}

function sanitizeRecent(raw: unknown): CatchRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: CatchRecord[] = [];
  for (const r of raw) {
    if (!isObj(r)) continue;
    if (typeof r.speciesId !== 'string' || !(r.speciesId in SPECIES_BY_ID)) continue;
    if (typeof r.id !== 'string') continue;
    out.push({
      id: r.id,
      speciesId: r.speciesId,
      weight: num(r.weight, 0, 1e6, 0),
      length: num(r.length, 0, 1e5, 0),
      value: int(r.value, 0, 1e9, 0),
      xp: int(r.xp, 0, 1e9, 0),
      trophy: r.trophy === true,
      time: num(r.time, 0, 1e15, 0),
      kept: r.kept !== false,
    });
    if (out.length >= MAX_RECENT) break;
  }
  return out;
}

export function sanitizeProfile(raw: unknown): Profile | null {
  if (!isObj(raw)) return null;
  const base = defaultProfile();

  const level = int(raw.level, 1, MAX_LEVEL, 1);
  const xp = level >= MAX_LEVEL ? 0 : int(raw.xp, 0, xpForLevel(level) - 1, 0);

  const owned = {} as Record<EquipmentCategory, string[]>;
  const equipped = {} as Record<EquipmentCategory, string>;
  const ownedRaw = isObj(raw.owned) ? raw.owned : {};
  const equippedRaw = isObj(raw.equipped) ? raw.equipped : {};
  for (const cat of EQUIPMENT_CATEGORIES) {
    const list = Array.isArray(ownedRaw[cat]) ? (ownedRaw[cat] as unknown[]) : [];
    const ids = new Set<string>([STARTER_EQUIPMENT[cat]]);
    for (const id of list) {
      if (typeof id === 'string' && EQUIPMENT_BY_ID[id]?.category === cat) ids.add(id);
    }
    owned[cat] = [...ids];
    const eq = equippedRaw[cat];
    equipped[cat] = typeof eq === 'string' && ids.has(eq) ? eq : STARTER_EQUIPMENT[cat];
  }

  const baitStock: Record<string, number> = {};
  const stockRaw = isObj(raw.baitStock) ? raw.baitStock : {};
  for (const id of Object.keys(BAIT_BY_ID)) {
    const n = int(stockRaw[id], 0, MAX_BAIT_STOCK, 0);
    if (n > 0) baitStock[id] = n;
  }
  const selectedRaw = raw.selectedBait;
  const selectedBait = isBaitId(selectedRaw) && (baitStock[selectedRaw] ?? 0) > 0 ? selectedRaw : firstStocked(baitStock) ?? base.selectedBait;

  return {
    level,
    xp,
    money: int(raw.money, 0, 1e12, base.money),
    owned,
    equipped,
    baitStock,
    selectedBait,
    stats: sanitizeStats(raw.stats),
    species: sanitizeSpecies(raw.species),
    recent: sanitizeRecent(raw.recent),
  };
}

function firstStocked(stock: Record<string, number>): string | null {
  for (const id of Object.keys(BAIT_BY_ID)) {
    if ((stock[id] ?? 0) > 0) return id;
  }
  return null;
}

export interface LoadResult {
  profile: Profile;
  existed: boolean;
}

export function loadSave(): LoadResult {
  try {
    const text = window.localStorage.getItem(SAVE_KEY);
    if (!text) return { profile: defaultProfile(), existed: false };
    const parsed: unknown = JSON.parse(text);
    if (!isObj(parsed)) return { profile: defaultProfile(), existed: false };
    const profile = sanitizeProfile(parsed.profile);
    if (!profile) return { profile: defaultProfile(), existed: false };
    return { profile, existed: true };
  } catch {
    return { profile: defaultProfile(), existed: false };
  }
}

export function writeSave(profile: Profile): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, profile }));
  } catch {
    return;
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    return;
  }
}
