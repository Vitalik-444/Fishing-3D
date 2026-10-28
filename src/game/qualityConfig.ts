import type { Quality } from '../store/settingsStore';

export interface QualityPreset {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  trees: number;
  bushes: number;
  grass: number;
  reeds: number;
  rocks: number;
  rain: number;
}

export const QUALITY: Record<Quality, QualityPreset> = {
  low: { dpr: [1, 1], shadows: false, shadowMapSize: 512, antialias: false, trees: 220, bushes: 50, grass: 900, reeds: 60, rocks: 40, rain: 150 },
  medium: { dpr: [1, 1.5], shadows: true, shadowMapSize: 1024, antialias: true, trees: 380, bushes: 90, grass: 2600, reeds: 110, rocks: 60, rain: 350 },
  high: { dpr: [1, 2], shadows: true, shadowMapSize: 2048, antialias: true, trees: 600, bushes: 150, grass: 5500, reeds: 170, rocks: 80, rain: 650 },
};
