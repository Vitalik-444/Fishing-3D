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

export type BobberMode = 'hanging' | 'flying' | 'floating' | 'grounded' | 'retrieving' | 'fighting';

export type WaitPhase = 'none' | 'waiting' | 'nibbling';

export type Weather = 'clear' | 'cloudy' | 'rain';
export type DayPeriod = 'dawn' | 'day' | 'dusk';

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

export interface FishInstance {
  id: string;
  speciesId: string;
  weight: number;
  length: number;
  value: number;
  xp: number;
  trophy: boolean;
}

export interface CatchRecord extends FishInstance {
  time: number;
  kept: boolean;
}

export type Rng = () => number;
