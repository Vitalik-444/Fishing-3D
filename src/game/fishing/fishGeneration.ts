import { RARITY_MULTIPLIER, type FishSpecies } from '../data/fishSpecies';
import { REWARD } from './fishingConfig';
import type { SpeciesWeight } from './biteSystem';
import type { FishInstance, Rng } from './fishingTypes';

export function pickSpecies(list: readonly SpeciesWeight[], rng: Rng): FishSpecies {
  const total = list.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return list[0].species;
  let r = rng() * total;
  for (const e of list) {
    r -= e.weight;
    if (r <= 0) return e.species;
  }
  return list[list.length - 1].species;
}

export function weightNorm(species: FishSpecies, weight: number): number {
  const span = species.maxWeight - species.minWeight;
  return span <= 0 ? 0 : Math.min(1, Math.max(0, (weight - species.minWeight) / span));
}

export function rollWeight(species: FishSpecies, rng: Rng): number {
  const n = Math.pow(rng(), REWARD.weightExponent);
  const w = species.minWeight + (species.maxWeight - species.minWeight) * n;
  return Math.round(w * 100) / 100;
}

export function lengthFor(species: FishSpecies, weight: number, rng: Rng): number {
  const n = Math.pow(weightNorm(species, weight), 0.45);
  const base = species.minLength + (species.maxLength - species.minLength) * n;
  const jitter = 1 + (rng() - 0.5) * 0.06;
  const len = Math.min(species.maxLength, Math.max(species.minLength, base * jitter));
  return Math.round(len);
}

export function fishValue(species: FishSpecies, weight: number, trophy: boolean): number {
  const bonus = trophy ? 1 + REWARD.trophyBonus : 1;
  return Math.max(1, Math.round(species.valuePerKg * RARITY_MULTIPLIER[species.rarity] * weight * bonus));
}

export function fishXp(species: FishSpecies, weight: number, trophy: boolean): number {
  const n = weightNorm(species, weight);
  const bonus = trophy ? 1.4 : 1;
  return Math.max(1, Math.round(species.xp * (1 + REWARD.xpWeightBonus * n) * bonus));
}

let counter = 0;

export function generateFish(species: FishSpecies, rng: Rng): FishInstance {
  const weight = rollWeight(species, rng);
  const trophy = weightNorm(species, weight) >= REWARD.trophyThreshold;
  counter += 1;
  return {
    id: `${Date.now().toString(36)}-${counter}-${Math.floor(rng() * 1e6).toString(36)}`,
    speciesId: species.id,
    weight,
    length: lengthFor(species, weight, rng),
    value: fishValue(species, weight, trophy),
    xp: fishXp(species, weight, trophy),
    trophy,
  };
}
