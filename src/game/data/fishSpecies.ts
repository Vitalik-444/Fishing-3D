import type { BaitId } from './baits';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type DepthZone = 'shallow' | 'mid' | 'deep';
export type FishPattern = 'plain' | 'stripes' | 'spots' | 'barbels' | 'pike';
export type TailShape = 'forked' | 'round';

export interface FishVisual {
  body: string;
  belly: string;
  fin: string;
  accent: string;
  bodyRatio: number;
  pattern: FishPattern;
  tail: TailShape;
}

export interface FishSpecies {
  id: string;
  name: string;
  latin: string;
  description: string;
  rarity: Rarity;
  minWeight: number;
  maxWeight: number;
  minLength: number;
  maxLength: number;
  baseBite: number;
  baitAffinity: Record<BaitId, number>;
  hookSize: number;
  zones: Record<DepthZone, number>;
  time: { dawn: number; day: number; dusk: number };
  weather: { clear: number; cloudy: number; rain: number };
  biteWindow: number;
  hookEase: number;
  strength: number;
  stamina: number;
  pullMin: number;
  pullMax: number;
  restMin: number;
  restMax: number;
  runSpeed: number;
  valuePerKg: number;
  xp: number;
  visual: FishVisual;
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
};

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.25,
  rare: 1.7,
  epic: 2.4,
};

export const FISH_SPECIES: readonly FishSpecies[] = [
  {
    id: 'common_roach',
    name: 'Common Roach',
    latin: 'Rutilus rutilus',
    description: 'A silvery shoal fish with red fins. Quick to bite and easy to land, ideal for beginners.',
    rarity: 'common',
    minWeight: 0.08,
    maxWeight: 1.1,
    minLength: 12,
    maxLength: 40,
    baseBite: 1.5,
    baitAffinity: { bait_bread: 1.5, bait_worms: 0.8, bait_maggots: 1.6, bait_corn: 0.5, bait_boilies: 0.1, bait_lure: 0.05 },
    hookSize: 1,
    zones: { shallow: 1.3, mid: 0.9, deep: 0.3 },
    time: { dawn: 1.15, day: 1, dusk: 1.1 },
    weather: { clear: 1, cloudy: 1.1, rain: 1 },
    biteWindow: 1.25,
    hookEase: 1,
    strength: 0.9,
    stamina: 5,
    pullMin: 0.6,
    pullMax: 1.2,
    restMin: 1.4,
    restMax: 2.6,
    runSpeed: 0.8,
    valuePerKg: 6,
    xp: 8,
    visual: { body: '#8fa3ab', belly: '#e8ece9', fin: '#d6502f', accent: '#c93b2a', bodyRatio: 0.9, pattern: 'plain', tail: 'forked' },
  },
  {
    id: 'crucian_carp',
    name: 'Crucian Carp',
    latin: 'Carassius carassius',
    description: 'A deep golden-bronze carp of weedy shallows. A gentle fighter and a great starter catch.',
    rarity: 'common',
    minWeight: 0.15,
    maxWeight: 1.6,
    minLength: 14,
    maxLength: 36,
    baseBite: 1.3,
    baitAffinity: { bait_bread: 1.2, bait_worms: 1.3, bait_maggots: 1.3, bait_corn: 0.8, bait_boilies: 0.2, bait_lure: 0.05 },
    hookSize: 1,
    zones: { shallow: 1.4, mid: 0.9, deep: 0.25 },
    time: { dawn: 1.2, day: 0.95, dusk: 1.1 },
    weather: { clear: 1, cloudy: 1.1, rain: 1.05 },
    biteWindow: 1.2,
    hookEase: 0.98,
    strength: 1.2,
    stamina: 7,
    pullMin: 0.7,
    pullMax: 1.4,
    restMin: 1.3,
    restMax: 2.4,
    runSpeed: 0.9,
    valuePerKg: 9,
    xp: 12,
    visual: { body: '#b58a3c', belly: '#e6cf8c', fin: '#a8672b', accent: '#8d5a22', bodyRatio: 1.25, pattern: 'plain', tail: 'forked' },
  },
  {
    id: 'european_perch',
    name: 'European Perch',
    latin: 'Perca fluviatilis',
    description: 'A striped predator with a spiny dorsal fin. Loves worms and small lures, and fights in short, sharp bursts.',
    rarity: 'common',
    minWeight: 0.1,
    maxWeight: 2.2,
    minLength: 14,
    maxLength: 46,
    baseBite: 1,
    baitAffinity: { bait_bread: 0.05, bait_worms: 1.5, bait_maggots: 0.7, bait_corn: 0, bait_boilies: 0, bait_lure: 1.6 },
    hookSize: 1.5,
    zones: { shallow: 1, mid: 1.2, deep: 0.7 },
    time: { dawn: 1.25, day: 1, dusk: 1.2 },
    weather: { clear: 1, cloudy: 1.1, rain: 1 },
    biteWindow: 1.05,
    hookEase: 0.95,
    strength: 1.8,
    stamina: 7,
    pullMin: 0.6,
    pullMax: 1.3,
    restMin: 1.2,
    restMax: 2.2,
    runSpeed: 1.2,
    valuePerKg: 10,
    xp: 14,
    visual: { body: '#6f8a3a', belly: '#e9e2b8', fin: '#d4572a', accent: '#2f3b21', bodyRatio: 1.1, pattern: 'stripes', tail: 'forked' },
  },
  {
    id: 'common_bream',
    name: 'Common Bream',
    latin: 'Abramis brama',
    description: 'A tall, slab-sided bottom feeder. It leans on the line and fights with steady weight.',
    rarity: 'common',
    minWeight: 0.3,
    maxWeight: 5,
    minLength: 22,
    maxLength: 70,
    baseBite: 0.9,
    baitAffinity: { bait_bread: 0.8, bait_worms: 1.5, bait_maggots: 1.4, bait_corn: 1, bait_boilies: 0.5, bait_lure: 0 },
    hookSize: 2,
    zones: { shallow: 0.6, mid: 1.2, deep: 1.1 },
    time: { dawn: 1.2, day: 0.9, dusk: 1.2 },
    weather: { clear: 0.95, cloudy: 1.1, rain: 1.1 },
    biteWindow: 1.1,
    hookEase: 0.95,
    strength: 2.6,
    stamina: 10,
    pullMin: 0.9,
    pullMax: 1.8,
    restMin: 1.3,
    restMax: 2.3,
    runSpeed: 1,
    valuePerKg: 8.5,
    xp: 22,
    visual: { body: '#a39a7a', belly: '#e0d9ba', fin: '#6f6a58', accent: '#7c7458', bodyRatio: 1.55, pattern: 'plain', tail: 'forked' },
  },
  {
    id: 'common_carp',
    name: 'Common Carp',
    latin: 'Cyprinus carpio',
    description: 'A powerful, golden-scaled carp. Corn and boilies tempt it, and it will make long, determined runs.',
    rarity: 'uncommon',
    minWeight: 0.8,
    maxWeight: 14,
    minLength: 35,
    maxLength: 95,
    baseBite: 0.9,
    baitAffinity: { bait_bread: 0.6, bait_worms: 0.7, bait_maggots: 0.5, bait_corn: 1.5, bait_boilies: 1.7, bait_lure: 0 },
    hookSize: 2,
    zones: { shallow: 0.9, mid: 1.1, deep: 1 },
    time: { dawn: 1.2, day: 0.95, dusk: 1.15 },
    weather: { clear: 1, cloudy: 1.1, rain: 1.05 },
    biteWindow: 1,
    hookEase: 0.92,
    strength: 4.2,
    stamina: 16,
    pullMin: 1.2,
    pullMax: 2.6,
    restMin: 1.2,
    restMax: 2.2,
    runSpeed: 1.5,
    valuePerKg: 11,
    xp: 40,
    visual: { body: '#9a7a35', belly: '#d9c27a', fin: '#8a5a2a', accent: '#6e4d1f', bodyRatio: 1.3, pattern: 'plain', tail: 'forked' },
  },
  {
    id: 'grass_carp',
    name: 'Grass Carp',
    latin: 'Ctenopharyngodon idella',
    description: 'A long, olive herbivore that cruises weedy water. Bread and corn work, and it fights hard.',
    rarity: 'rare',
    minWeight: 1,
    maxWeight: 15,
    minLength: 40,
    maxLength: 100,
    baseBite: 0.45,
    baitAffinity: { bait_bread: 1.3, bait_worms: 0.1, bait_maggots: 0, bait_corn: 1.1, bait_boilies: 0.3, bait_lure: 0 },
    hookSize: 2,
    zones: { shallow: 1.2, mid: 1, deep: 0.5 },
    time: { dawn: 1, day: 1.2, dusk: 0.9 },
    weather: { clear: 1.15, cloudy: 1, rain: 0.8 },
    biteWindow: 0.95,
    hookEase: 0.9,
    strength: 4.6,
    stamina: 18,
    pullMin: 1.3,
    pullMax: 2.8,
    restMin: 1.1,
    restMax: 2,
    runSpeed: 1.6,
    valuePerKg: 12,
    xp: 55,
    visual: { body: '#6d7b4a', belly: '#d8d9b0', fin: '#7b805c', accent: '#4f5a35', bodyRatio: 1.05, pattern: 'plain', tail: 'forked' },
  },
  {
    id: 'northern_pike',
    name: 'Northern Pike',
    latin: 'Esox lucius',
    description: 'A fast ambush predator with a duck-bill snout. It takes lures hard and fights in violent surges.',
    rarity: 'rare',
    minWeight: 1,
    maxWeight: 14,
    minLength: 45,
    maxLength: 125,
    baseBite: 0.5,
    baitAffinity: { bait_bread: 0, bait_worms: 0.12, bait_maggots: 0, bait_corn: 0, bait_boilies: 0, bait_lure: 2 },
    hookSize: 3,
    zones: { shallow: 1.1, mid: 1, deep: 0.8 },
    time: { dawn: 1.2, day: 1, dusk: 1.2 },
    weather: { clear: 0.95, cloudy: 1.25, rain: 1.1 },
    biteWindow: 0.8,
    hookEase: 0.88,
    strength: 5.8,
    stamina: 14,
    pullMin: 0.8,
    pullMax: 1.9,
    restMin: 0.9,
    restMax: 1.8,
    runSpeed: 2.4,
    valuePerKg: 17,
    xp: 70,
    visual: { body: '#58703a', belly: '#e8e3bf', fin: '#9c6a2e', accent: '#d8d48a', bodyRatio: 0.78, pattern: 'pike', tail: 'forked' },
  },
  {
    id: 'european_catfish',
    name: 'European Catfish',
    latin: 'Silurus glanis',
    description: 'The giant of the lake. Scaleless, whiskered and enormously strong, it will test every part of your gear.',
    rarity: 'epic',
    minWeight: 2,
    maxWeight: 30,
    minLength: 60,
    maxLength: 170,
    baseBite: 0.22,
    baitAffinity: { bait_bread: 0, bait_worms: 1.2, bait_maggots: 0.1, bait_corn: 0.3, bait_boilies: 1, bait_lure: 0.5 },
    hookSize: 3,
    zones: { shallow: 0.3, mid: 0.9, deep: 1.6 },
    time: { dawn: 1.1, day: 0.7, dusk: 1.6 },
    weather: { clear: 0.9, cloudy: 1.1, rain: 1.3 },
    biteWindow: 0.95,
    hookEase: 0.9,
    strength: 8.2,
    stamina: 26,
    pullMin: 1.6,
    pullMax: 3.4,
    restMin: 1,
    restMax: 1.8,
    runSpeed: 2,
    valuePerKg: 20,
    xp: 140,
    visual: { body: '#4d4a3b', belly: '#bdb58f', fin: '#3b392e', accent: '#2a2920', bodyRatio: 1.15, pattern: 'barbels', tail: 'round' },
  },
];

export const SPECIES_BY_ID: Record<string, FishSpecies> = Object.fromEntries(FISH_SPECIES.map((s) => [s.id, s]));
