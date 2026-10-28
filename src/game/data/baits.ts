export type BaitId = 'bait_bread' | 'bait_worms' | 'bait_maggots' | 'bait_corn' | 'bait_boilies' | 'bait_lure';

export interface BaitItem {
  id: BaitId;
  name: string;
  description: string;
  price: number;
  packSize: number;
  unlockLevel: number;
  reusable: boolean;
}

export const BAITS: readonly BaitItem[] = [
  {
    id: 'bait_bread',
    name: 'Bread',
    description: 'Soft dough balls. Roach, crucian carp and grass carp take it readily.',
    price: 8,
    packSize: 15,
    unlockLevel: 1,
    reusable: false,
  },
  {
    id: 'bait_worms',
    name: 'Worms',
    description: 'The all-rounder. Perch, bream, crucian carp and catfish all like a worm.',
    price: 12,
    packSize: 12,
    unlockLevel: 1,
    reusable: false,
  },
  {
    id: 'bait_maggots',
    name: 'Maggots',
    description: 'Lively and cheap. Roach, crucian carp and bream cannot resist them.',
    price: 12,
    packSize: 12,
    unlockLevel: 2,
    reusable: false,
  },
  {
    id: 'bait_corn',
    name: 'Corn',
    description: 'Sweet and bright. A favourite of common carp and grass carp.',
    price: 15,
    packSize: 10,
    unlockLevel: 3,
    reusable: false,
  },
  {
    id: 'bait_boilies',
    name: 'Boilies',
    description: 'Hard, scented baits made for big carp and catfish.',
    price: 30,
    packSize: 10,
    unlockLevel: 4,
    reusable: false,
  },
  {
    id: 'bait_lure',
    name: 'Small Artificial Lure',
    description: 'A reusable spinner. Predators such as pike and perch go for it. One is enough.',
    price: 45,
    packSize: 1,
    unlockLevel: 3,
    reusable: true,
  },
];

export const BAIT_BY_ID: Record<string, BaitItem> = Object.fromEntries(BAITS.map((b) => [b.id, b]));

export function isBaitId(id: unknown): id is BaitId {
  return typeof id === 'string' && id in BAIT_BY_ID;
}
