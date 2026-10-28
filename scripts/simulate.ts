import { FISH_SPECIES } from '../src/game/data/fishSpecies';
import { RODS, REELS, LINES, HOOKS } from '../src/game/data/equipment';
import { createFight, stepFight, type FightParams } from '../src/game/fishing/fishFight';
import { generateFish } from '../src/game/fishing/fishGeneration';

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Skill = 'good' | 'mash' | 'idle';

function run(params: FightParams, dist: number, skill: Skill, rng: () => number) {
  const f = createFight(params, dist, rng);
  const dt = 1 / 30;
  let t = 0;
  while (f.outcome === 'none' && t < 240) {
    let reeling = true;
    let give = false;
    if (skill === 'good') {
      if (f.ratio > 0.78) reeling = false;
      if (f.ratio > 0.95) give = true;
    } else if (skill === 'idle') reeling = false;
    stepFight(f, params, { reeling, giveLine: give }, dt, rng);
    t += dt;
  }
  return { outcome: f.outcome, time: f.elapsed };
}

const gear = (i: number): Pick<FightParams, 'rod' | 'reel' | 'line' | 'hook'> => ({
  rod: RODS[Math.min(i, RODS.length - 1)].stats,
  reel: REELS[Math.min(i, REELS.length - 1)].stats,
  line: LINES[Math.min(i, LINES.length - 1)].stats,
  hook: HOOKS[Math.min(i > 1 ? 2 : i, HOOKS.length - 1)].stats,
});

for (const tier of [0, 1, 2, 3, 4]) {
  console.log(`\n== gear tier ${tier}`);
  for (const sp of FISH_SPECIES) {
    for (const skill of ['good', 'mash'] as Skill[]) {
      let landed = 0, broken = 0, escaped = 0, time = 0;
      const N = 150;
      const rng = mulberry(tier * 1000 + 7);
      for (let i = 0; i < N; i++) {
        const fish = generateFish(sp, rng);
        const r = run({ species: sp, weight: fish.weight, ...gear(tier) }, 14 + rng() * 26, skill, rng);
        if (r.outcome === 'landed') { landed++; time += r.time; }
        else if (r.outcome === 'broken') broken++;
        else escaped++;
      }
      console.log(`${sp.id.padEnd(18)} ${skill.padEnd(5)} land ${String(Math.round(landed / N * 100)).padStart(3)}%  brk ${String(Math.round(broken / N * 100)).padStart(3)}%  esc ${String(Math.round(escaped / N * 100)).padStart(3)}%  avg ${landed ? (time / landed).toFixed(1) : '-'}s`);
    }
  }
}
