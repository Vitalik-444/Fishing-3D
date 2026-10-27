export type FishingState =
  | 'idle'
  | 'preparing'
  | 'casting'
  | 'waiting'
  | 'bite'
  | 'hooking'
  | 'fighting'
  | 'caught'
  | 'escaped'
  | 'lineBroken';

export type BobberMode = 'hanging' | 'flying' | 'floating' | 'grounded' | 'retrieving';

/** Valid transitions. Milestone 2 plugs bite/hooking/fighting into the same table. */
export const TRANSITIONS: Record<FishingState, readonly FishingState[]> = {
  idle: ['preparing'],
  preparing: ['idle', 'casting'],
  casting: ['waiting', 'idle'],
  waiting: ['bite', 'idle'],
  bite: ['hooking', 'waiting', 'escaped'],
  hooking: ['fighting', 'escaped'],
  fighting: ['caught', 'escaped', 'lineBroken'],
  caught: ['idle'],
  escaped: ['idle'],
  lineBroken: ['idle'],
};

export function canTransition(from: FishingState, to: FishingState): boolean {
  return TRANSITIONS[from].includes(to);
}
