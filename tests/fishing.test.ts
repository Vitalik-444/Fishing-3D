import { describe, expect, it, beforeEach } from 'vitest';
import { FISH_SPECIES, SPECIES_BY_ID } from '../src/game/data/fishSpecies';
import { HOOKS, LINES, REELS, RODS } from '../src/game/data/equipment';
import { speciesWeights, hookChance, rollWaitTime } from '../src/game/fishing/biteSystem';
import { generateFish, pickSpecies } from '../src/game/fishing/fishGeneration';
import { createFight, stepFight, type FightParams } from '../src/game/fishing/fishFight';
import { canTransition } from '../src/game/fishing/fishingTypes';
import { defaultProfile, sanitizeProfile } from '../src/services/persistence';
import { applyXp } from '../src/game/progression';

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cond = (baitId: 'bait_bread' | 'bait_worms' | 'bait_maggots' | 'bait_corn' | 'bait_boilies' | 'bait_lure') => ({
  baitId, hook: HOOKS[0].stats, depth: 2, period: 'day' as const, weather: 'clear' as const,
});

describe('bite system', () => {
  it('bait changes which species are likely', () => {
    const corn = speciesWeights(cond('bait_corn'));
    const lure = speciesWeights(cond('bait_lure'));
    const w = (l: typeof corn, id: string) => l.find((e) => e.species.id === id)!.weight;
    expect(w(corn, 'common_carp')).toBeGreaterThan(w(lure, 'common_carp') * 10);
    expect(w(lure, 'northern_pike')).toBeGreaterThan(w(corn, 'northern_pike') * 10);
  });
  it('wait time stays inside configured limits', () => {
    const rng = seeded(1);
    for (let i = 0; i < 200; i++) {
      const t = rollWaitTime(1, rng);
      expect(t).toBeGreaterThanOrEqual(2.5);
      expect(t).toBeLessThanOrEqual(15);
    }
  });
  it('late hook timing lowers chance', () => {
    const sp = SPECIES_BY_ID.common_roach;
    expect(hookChance(sp, HOOKS[0].stats, 0.9)).toBeLessThan(hookChance(sp, HOOKS[0].stats, 0.2));
  });
});

describe('fish generation', () => {
  it('weights and lengths stay inside species ranges', () => {
    const rng = seeded(7);
    for (const sp of FISH_SPECIES) {
      for (let i = 0; i < 100; i++) {
        const f = generateFish(sp, rng);
        expect(f.weight).toBeGreaterThanOrEqual(sp.minWeight);
        expect(f.weight).toBeLessThanOrEqual(sp.maxWeight);
        expect(f.length).toBeGreaterThanOrEqual(sp.minLength);
        expect(f.length).toBeLessThanOrEqual(sp.maxLength);
        expect(f.value).toBeGreaterThan(0);
      }
    }
  });
  it('picks only species with weight when others are zero', () => {
    const list = speciesWeights(cond('bait_lure'));
    const rng = seeded(3);
    for (let i = 0; i < 100; i++) expect(pickSpecies(list, rng).baitAffinity.bait_lure).toBeGreaterThan(0);
  });
  it('ids are unique', () => {
    const rng = seeded(9);
    const ids = new Set(Array.from({ length: 200 }, () => generateFish(FISH_SPECIES[0], rng).id));
    expect(ids.size).toBe(200);
  });
});

describe('fight', () => {
  const params = (speciesId: string, weight: number): FightParams => ({
    species: SPECIES_BY_ID[speciesId], weight,
    rod: RODS[0].stats, reel: REELS[0].stats, line: LINES[0].stats, hook: HOOKS[0].stats,
  });
  const run = (p: FightParams, reeling: (r: number) => boolean, give = true) => {
    const rng = seeded(5);
    const f = createFight(p, 25, rng);
    for (let i = 0; i < 30 * 300 && f.outcome === 'none'; i++) {
      stepFight(f, p, { reeling: reeling(f.ratio), giveLine: give && f.ratio > 0.95 }, 1 / 30, rng);
    }
    return f;
  };
  it('a roach is landed with careful reeling', () => {
    expect(run(params('common_roach', 0.4), (r) => r < 0.78).outcome).toBe('landed');
  });
  it('holding reel against a big pike breaks the line', () => {
    expect(run(params('northern_pike', 10), () => true, false).outcome).toBe('broken');
  });
  it('doing nothing against a pulling fish never lands it', () => {
    expect(run(params('common_carp', 6), () => false).outcome).not.toBe('landed');
  });
  it('outcome is final', () => {
    const p = params('common_roach', 0.3);
    const f = run(p, (r) => r < 0.78);
    const d = f.distance;
    stepFight(f, p, { reeling: true, giveLine: false }, 1, seeded(1));
    expect(f.distance).toBe(d);
  });
});

describe('state machine', () => {
  it('forbids illegal transitions', () => {
    expect(canTransition('fighting', 'preparing')).toBe(false);
    expect(canTransition('idle', 'hooking')).toBe(false);
    expect(canTransition('caught', 'caught')).toBe(false);
    expect(canTransition('bite', 'hooking')).toBe(true);
  });
});

describe('persistence', () => {
  it('rejects garbage and repairs bad data', () => {
    expect(sanitizeProfile(null)).toBeNull();
    expect(sanitizeProfile('x')).toBeNull();
    const p = sanitizeProfile({ level: 'a', money: -5, owned: { rod: ['nope', 'rod_carp'] }, equipped: { rod: 'rod_pro' }, baitStock: { bait_corn: 500 }, selectedBait: 'bait_worms' });
    expect(p).not.toBeNull();
    expect(p!.level).toBe(1);
    expect(p!.money).toBe(0);
    expect(p!.owned.rod).toContain('rod_carp');
    expect(p!.owned.rod).not.toContain('nope');
    expect(p!.equipped.rod).toBe('rod_basic');
    expect(p!.baitStock.bait_corn).toBe(99);
    expect(p!.selectedBait).toBe('bait_corn');
  });
  it('round-trips the default profile', () => {
    expect(sanitizeProfile(JSON.parse(JSON.stringify(defaultProfile())))).toEqual(defaultProfile());
  });
});

describe('progression', () => {
  it('levels up and carries xp', () => {
    const r = applyXp(1, 0, 1000);
    expect(r.level).toBeGreaterThan(1);
    expect(r.levelsGained).toBe(r.level - 1);
  });
});

describe('store', () => {
  beforeEach(async () => {
    const { useGameStore } = await import('../src/store/gameStore');
    useGameStore.getState().startNewGame();
  });
  it('blocks purchases without funds or level, and does not duplicate', async () => {
    const { useGameStore } = await import('../src/store/gameStore');
    const s = useGameStore.getState();
    expect(s.buyItem('rod_pro').ok).toBe(false);
    expect(s.equipItem('rod_match').ok).toBe(false);
    expect(useGameStore.getState().profile.money).toBe(100);
    useGameStore.setState({ profile: { ...useGameStore.getState().profile, level: 3, money: 130 } });
    expect(useGameStore.getState().buyItem('rod_match').ok).toBe(true);
    expect(useGameStore.getState().profile.money).toBe(10);
    expect(useGameStore.getState().buyItem('rod_match').ok).toBe(false);
    expect(useGameStore.getState().equipItem('rod_match').ok).toBe(true);
  });
  it('awards a catch exactly once', async () => {
    const { useGameStore } = await import('../src/store/gameStore');
    const fish = generateFish(FISH_SPECIES[0], seeded(2));
    const s = useGameStore.getState();
    expect(s.registerCatch(fish)).not.toBeNull();
    expect(useGameStore.getState().registerCatch(fish)).toBeNull();
    const before = useGameStore.getState().profile.money;
    useGameStore.getState().resolveCatch(true);
    expect(useGameStore.getState().profile.money).toBe(before + fish.value);
    expect(useGameStore.getState().resolveCatch(true)).toBeNull();
    expect(useGameStore.getState().profile.money).toBe(before + fish.value);
    expect(useGameStore.getState().profile.stats.totalCatches).toBe(1);
  });
  it('consumes bait and refuses at zero', async () => {
    const { useGameStore } = await import('../src/store/gameStore');
    useGameStore.setState({ profile: { ...useGameStore.getState().profile, baitStock: { bait_worms: 1 } } });
    expect(useGameStore.getState().consumeBait()).toBe(true);
    expect(useGameStore.getState().consumeBait()).toBe(false);
  });
});
