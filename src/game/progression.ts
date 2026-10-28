export const MAX_LEVEL = 50;
export const STARTING_MONEY = 100;

export function xpForLevel(level: number): number {
  return Math.round(60 * Math.pow(level, 1.55));
}

export function applyXp(level: number, xp: number, gained: number): { level: number; xp: number; levelsGained: number } {
  let l = level;
  let x = xp + Math.max(0, gained);
  let levelsGained = 0;
  while (l < MAX_LEVEL && x >= xpForLevel(l)) {
    x -= xpForLevel(l);
    l += 1;
    levelsGained += 1;
  }
  if (l >= MAX_LEVEL) x = 0;
  return { level: l, xp: x, levelsGained };
}
