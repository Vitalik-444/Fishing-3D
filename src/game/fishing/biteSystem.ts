import { BITE } from './fishingConfig';
import { CURRENT_LOCATION } from '../data/locations';
import { FISH_SPECIES, type DepthZone, type FishSpecies } from '../data/fishSpecies';
import type { BaitId } from '../data/baits';
import type { HookStats } from '../data/equipment';
import type { DayPeriod, Rng, Weather } from './fishingTypes';

export interface BiteConditions {
  baitId: BaitId;
  hook: HookStats;
  depth: number;
  period: DayPeriod;
  weather: Weather;
}

export interface SpeciesWeight {
  species: FishSpecies;
  weight: number;
}

export function depthZone(depth: number): DepthZone {
  if (depth < BITE.shallowDepth) return 'shallow';
  if (depth < BITE.deepDepth) return 'mid';
  return 'deep';
}

export function hookFit(species: FishSpecies, hook: HookStats): number {
  return Math.max(0.45, 1 - 0.28 * Math.abs(hook.size - species.hookSize));
}

export function speciesWeight(species: FishSpecies, c: BiteConditions): number {
  const bait = species.baitAffinity[c.baitId] ?? 0;
  const zone = species.zones[depthZone(c.depth)];
  const time = species.time[c.period];
  const weather = species.weather[c.weather];
  const place = CURRENT_LOCATION.abundance[species.id] ?? 1;
  return species.baseBite * bait * zone * time * weather * place * hookFit(species, c.hook);
}

export function speciesWeights(c: BiteConditions): SpeciesWeight[] {
  return FISH_SPECIES.map((species) => ({ species, weight: speciesWeight(species, c) }));
}

export function totalWeight(list: readonly SpeciesWeight[]): number {
  return list.reduce((sum, e) => sum + e.weight, 0);
}

export function activityLevel(list: readonly SpeciesWeight[]): number {
  const level = totalWeight(list) / BITE.referenceWeight;
  return Math.min(BITE.maxActivity, Math.max(BITE.minActivity, level));
}

export function rollWaitTime(activity: number, rng: Rng): number {
  const mean = BITE.meanWait / activity;
  const wait = -Math.log(1 - Math.min(rng(), 0.999)) * mean;
  return Math.min(BITE.maxWait, Math.max(BITE.minWait, wait));
}

export function rollNibbleTime(rng: Rng): number {
  return BITE.nibbleMin + (BITE.nibbleMax - BITE.nibbleMin) * rng();
}

export function biteWindow(species: FishSpecies, hook: HookStats): number {
  return Math.max(BITE.minWindow, (BITE.baseWindow + hook.windowBonus) * species.biteWindow);
}

export function hookChance(species: FishSpecies, hook: HookStats, windowFraction: number): number {
  const f = Math.min(1, Math.max(0, windowFraction));
  const timing = f <= 0.6 ? 1 : 1 - (1 - BITE.lateTimingFloor) * ((f - 0.6) / 0.4);
  const chance = species.hookEase * hook.hookRate * timing;
  return Math.min(BITE.maxHookChance, Math.max(BITE.minHookChance, chance));
}
