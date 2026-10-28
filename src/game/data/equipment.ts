export type EquipmentCategory = 'rod' | 'reel' | 'line' | 'hook';

export const EQUIPMENT_CATEGORIES: readonly EquipmentCategory[] = ['rod', 'reel', 'line', 'hook'];

export interface RodStats { castPower: number; strength: number; maxTension: number }
export interface ReelStats { speed: number; drag: number; efficiency: number }
export interface LineStats { breakStrength: number }
export interface HookStats { size: number; hookRate: number; hold: number; windowBonus: number }

interface Base<C extends EquipmentCategory, S> {
  id: string;
  category: C;
  name: string;
  description: string;
  price: number;
  unlockLevel: number;
  stats: S;
}

export type Rod = Base<'rod', RodStats>;
export type Reel = Base<'reel', ReelStats>;
export type Line = Base<'line', LineStats>;
export type Hook = Base<'hook', HookStats>;
export type EquipmentItem = Rod | Reel | Line | Hook;

export const RODS: readonly Rod[] = [
  { id: 'rod_basic', category: 'rod', name: 'Basic Rod', description: 'A light starter rod. Fine for small fish.', price: 0, unlockLevel: 1, stats: { castPower: 1, strength: 1, maxTension: 5 } },
  { id: 'rod_match', category: 'rod', name: 'Match Rod', description: 'A balanced rod with a better cast and a firmer backbone.', price: 120, unlockLevel: 3, stats: { castPower: 1.12, strength: 1.3, maxTension: 6.5 } },
  { id: 'rod_carp', category: 'rod', name: 'Carp Rod', description: 'Built to absorb long runs from heavy fish.', price: 320, unlockLevel: 6, stats: { castPower: 1.22, strength: 1.8, maxTension: 9 } },
  { id: 'rod_heavy', category: 'rod', name: 'Heavy Rod', description: 'Stiff and powerful. Made for pike and catfish.', price: 700, unlockLevel: 10, stats: { castPower: 1.35, strength: 2.6, maxTension: 13 } },
  { id: 'rod_pro', category: 'rod', name: 'Pro Rod', description: 'Top-tier carbon with extreme casting range.', price: 1500, unlockLevel: 15, stats: { castPower: 1.5, strength: 3.4, maxTension: 18 } },
];

export const REELS: readonly Reel[] = [
  { id: 'reel_basic', category: 'reel', name: 'Basic Reel', description: 'Slow, simple and a little sticky.', price: 0, unlockLevel: 1, stats: { speed: 4, drag: 3, efficiency: 0.55 } },
  { id: 'reel_spin', category: 'reel', name: 'Spinning Reel', description: 'Smoother drag and a faster retrieve.', price: 100, unlockLevel: 2, stats: { speed: 4.6, drag: 4.5, efficiency: 0.62 } },
  { id: 'reel_carp', category: 'reel', name: 'Carp Reel', description: 'Strong drag for heavy fish.', price: 280, unlockLevel: 5, stats: { speed: 5.2, drag: 6.5, efficiency: 0.7 } },
  { id: 'reel_pro', category: 'reel', name: 'Pro Reel', description: 'Fast, efficient and very strong.', price: 650, unlockLevel: 9, stats: { speed: 5.8, drag: 9.5, efficiency: 0.78 } },
  { id: 'reel_elite', category: 'reel', name: 'Elite Reel', description: 'Competition-grade machining.', price: 1400, unlockLevel: 14, stats: { speed: 6.6, drag: 13, efficiency: 0.86 } },
];

export const LINES: readonly Line[] = [
  { id: 'line_020', category: 'line', name: '0.20 mm Mono', description: 'Thin starter line. Breaks easily.', price: 0, unlockLevel: 1, stats: { breakStrength: 5 } },
  { id: 'line_025', category: 'line', name: '0.25 mm Mono', description: 'A noticeable step up in strength.', price: 60, unlockLevel: 2, stats: { breakStrength: 7 } },
  { id: 'line_030', category: 'line', name: '0.30 mm Mono', description: 'Reliable for carp-sized fish.', price: 150, unlockLevel: 4, stats: { breakStrength: 10 } },
  { id: 'line_040', category: 'line', name: '0.40 mm Braid', description: 'Strong, low-stretch braid.', price: 380, unlockLevel: 8, stats: { breakStrength: 15 } },
  { id: 'line_050', category: 'line', name: '0.50 mm Braid', description: 'Heavy braid for the biggest fish in the lake.', price: 800, unlockLevel: 12, stats: { breakStrength: 22 } },
];

export const HOOKS: readonly Hook[] = [
  { id: 'hook_small', category: 'hook', name: 'Small Hook (size 1)', description: 'Ideal for roach, crucian carp and perch. Forgiving on bites.', price: 0, unlockLevel: 1, stats: { size: 1, hookRate: 0.9, hold: 0.8, windowBonus: 0.25 } },
  { id: 'hook_medium', category: 'hook', name: 'Medium Hook (size 2)', description: 'Suits bream and carp.', price: 25, unlockLevel: 2, stats: { size: 2, hookRate: 0.95, hold: 1, windowBonus: 0.15 } },
  { id: 'hook_large', category: 'hook', name: 'Large Hook (size 3)', description: 'Holds big fish like pike and catfish.', price: 60, unlockLevel: 5, stats: { size: 3, hookRate: 1, hold: 1.25, windowBonus: 0 } },
];

export const EQUIPMENT: readonly EquipmentItem[] = [...RODS, ...REELS, ...LINES, ...HOOKS];

export const EQUIPMENT_BY_ID: Record<string, EquipmentItem> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));

export const STARTER_EQUIPMENT: Record<EquipmentCategory, string> = {
  rod: 'rod_basic',
  reel: 'reel_basic',
  line: 'line_020',
  hook: 'hook_small',
};

export const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  rod: 'Rods',
  reel: 'Reels',
  line: 'Lines',
  hook: 'Hooks',
};

export function itemsOf(category: EquipmentCategory): readonly EquipmentItem[] {
  return EQUIPMENT.filter((e) => e.category === category);
}

export function statLines(item: EquipmentItem): { label: string; value: string }[] {
  switch (item.category) {
    case 'rod':
      return [
        { label: 'Casting power', value: `${Math.round(item.stats.castPower * 100)}%` },
        { label: 'Rod strength', value: item.stats.strength.toFixed(1) },
        { label: 'Max line tension', value: `${item.stats.maxTension} kg` },
      ];
    case 'reel':
      return [
        { label: 'Reel speed', value: `${item.stats.speed.toFixed(1)} m/s` },
        { label: 'Drag strength', value: `${item.stats.drag} kg` },
        { label: 'Efficiency', value: `${Math.round(item.stats.efficiency * 100)}%` },
      ];
    case 'line':
      return [{ label: 'Breaking strength', value: `${item.stats.breakStrength} kg` }];
    case 'hook':
      return [
        { label: 'Hook size', value: String(item.stats.size) },
        { label: 'Hook-up rate', value: `${Math.round(item.stats.hookRate * 100)}%` },
        { label: 'Holding power', value: `${Math.round(item.stats.hold * 100)}%` },
        { label: 'Bite window', value: `+${item.stats.windowBonus.toFixed(2)} s` },
      ];
  }
}
