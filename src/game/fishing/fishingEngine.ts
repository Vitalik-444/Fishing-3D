import { useGameStore } from '../../store/gameStore';
import { sfx } from '../../services/audio';
import { BITE, CAST, FIGHT } from './fishingConfig';
import { runtime } from './fishingRuntime';
import { baitAvailable, gearOf } from './gear';
import { activityLevel, biteWindow, hookChance, rollNibbleTime, rollWaitTime, speciesWeights } from './biteSystem';
import { generateFish, pickSpecies } from './fishGeneration';
import { createFight, fightCapacity, fightProgress, stepFight, type FightParams } from './fishFight';
import { SPECIES_BY_ID } from '../data/fishSpecies';
import { BAITS } from '../data/baits';
import { spawnRipple, spawnSplash } from '../effects';
import { bobber, player } from '../player/playerState';
import { env, periodOf } from '../world/environment';
import { terrainHeight } from '../world/terrain';
import type { Rng } from './fishingTypes';

let random: Rng = Math.random;

export function setRandom(fn: Rng): void {
  random = fn;
}

export function startCharge(): void {
  const s = useGameStore.getState();
  if (s.phase !== 'playing') return;
  if (s.fishingState !== 'idle' || runtime.bobberMode !== 'hanging') return;
  if (s.pendingCatch) return;
  if (!baitAvailable(s.profile)) {
    s.notify('Out of bait. Open the shop to buy more, or select another bait.');
    sfx('error');
    return;
  }
  if (!s.transition('preparing')) return;
  runtime.charge = 0;
  runtime.whipTime = -1;
}

export function releaseCharge(): void {
  const s = useGameStore.getState();
  if (s.fishingState !== 'preparing') return;
  if (runtime.charge < CAST.minCharge) {
    runtime.charge = 0;
    s.transition('idle');
    return;
  }
  runtime.castPower = runtime.charge;
  runtime.whipTime = 0;
  s.recordCast();
  s.transition('casting');
  sfx('cast');
}

export function cancelCharge(): void {
  const s = useGameStore.getState();
  if (s.fishingState === 'preparing') {
    runtime.charge = 0;
    s.transition('idle');
  }
}

export function cancelHeldInputs(): void {
  runtime.reeling = false;
  runtime.giveLine = false;
}

export function retrieveLine(): void {
  const s = useGameStore.getState();
  if (s.phase !== 'playing') return;
  if (runtime.bobberMode !== 'floating' && runtime.bobberMode !== 'grounded') return;
  if (!s.transition('idle')) return;
  runtime.waitPhase = 'none';
  runtime.nibble = 0;
  runtime.bobberMode = 'retrieving';
  s.setRetrieving(true);
}

function currentDepth(): number {
  return Math.max(0, -terrainHeight(bobber.position.x, bobber.position.z));
}

function scheduleWait(extra: number): void {
  const s = useGameStore.getState();
  const gear = gearOf(s.profile);
  const weights = speciesWeights({
    baitId: gear.bait.id,
    hook: gear.hook.stats,
    depth: currentDepth(),
    period: periodOf(env.hour),
    weather: env.weather,
  });
  runtime.weights = weights;
  runtime.waitPhase = 'waiting';
  runtime.waitTimer = rollWaitTime(activityLevel(weights), random) + extra;
  runtime.nibble = 0;
}

export function onSplashdown(): void {
  const s = useGameStore.getState();
  if (!s.transition('waiting')) return;
  scheduleWait(0);
  sfx('splash');
}

function beginNibbling(): void {
  runtime.waitPhase = 'nibbling';
  runtime.nibbleTimer = rollNibbleTime(random);
  runtime.nibbleTick = 0.2;
}

function doBite(): void {
  const s = useGameStore.getState();
  if (!s.consumeBait()) {
    runtime.waitPhase = 'none';
    return;
  }
  const gear = gearOf(useGameStore.getState().profile);
  const species = pickSpecies(runtime.weights, random);
  runtime.fish = generateFish(species, random);
  runtime.waitPhase = 'none';
  if (!s.transition('bite')) {
    runtime.fish = null;
    return;
  }
  runtime.biteWindow = biteWindow(species, gear.hook.stats);
  runtime.biteTimer = runtime.biteWindow;
  runtime.nibble = 1;
  spawnRipple(bobber.position.x, bobber.position.z, 1.2, 1.1);
  spawnSplash(bobber.position.x, bobber.position.y, bobber.position.z, 0.6);
  sfx('bite');
}

function finishEncounter(kind: 'escaped' | 'lineBroken', text: string): void {
  const s = useGameStore.getState();
  if (!s.transition(kind)) return;
  if (kind === 'escaped') s.recordEscape();
  else s.recordLineBreak();
  s.showBanner(kind === 'escaped' ? 'escaped' : 'broken', text);
  runtime.fish = null;
  runtime.fight = null;
  runtime.fightParams = null;
  runtime.reeling = false;
  runtime.giveLine = false;
  runtime.tensionRatio = 0;
  runtime.endTimer = BITE.endDelay;
  if (runtime.bobberMode === 'fighting') runtime.bobberMode = 'floating';
  sfx(kind === 'escaped' ? 'escape' : 'snap');
}

function endEncounter(): void {
  const s = useGameStore.getState();
  s.clearBanner();
  runtime.bobberMode = 'retrieving';
  s.setRetrieving(true);
  s.transition('idle');
}

export function strike(): void {
  const s = useGameStore.getState();
  if (s.phase !== 'playing') return;
  if (s.fishingState === 'bite') {
    const fish = runtime.fish;
    if (!fish) return;
    const species = SPECIES_BY_ID[fish.speciesId];
    const gear = gearOf(s.profile);
    const fraction = 1 - runtime.biteTimer / runtime.biteWindow;
    if (random() < hookChance(species, gear.hook.stats, fraction)) {
      if (s.transition('hooking')) {
        runtime.hookTimer = BITE.hookDelay;
        spawnSplash(bobber.position.x, bobber.position.y, bobber.position.z, 1);
        sfx('hook');
      }
    } else {
      finishEncounter('escaped', 'The hook did not set. The fish spat it out.');
    }
    return;
  }
  if (s.fishingState === 'waiting' && runtime.waitPhase === 'nibbling') {
    scheduleWait(BITE.spookDelay);
    s.notify('Too early. You spooked the fish.');
    sfx('error');
  }
}

function startFight(): void {
  const s = useGameStore.getState();
  const fish = runtime.fish;
  if (!fish) return;
  const species = SPECIES_BY_ID[fish.speciesId];
  const gear = gearOf(s.profile);
  const params: FightParams = {
    species,
    weight: fish.weight,
    rod: gear.rod.stats,
    reel: gear.reel.stats,
    line: gear.line.stats,
    hook: gear.hook.stats,
  };
  const dx = bobber.position.x - player.position.x;
  const dz = bobber.position.z - player.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist > 0.001) {
    runtime.fightDirX = dx / dist;
    runtime.fightDirZ = dz / dist;
  }
  const fight = createFight(params, dist, random);
  if (!s.transition('fighting')) return;
  runtime.fightParams = params;
  runtime.fight = fight;
  runtime.capacity = fightCapacity(params);
  runtime.fightDistance = fight.distance;
  runtime.fightStart = fight.startDistance;
  runtime.fightProgress = 0;
  runtime.fightStamina = 1;
  runtime.tensionRatio = 0;
  runtime.tension = 0;
  runtime.lastPhase = 'rest';
  runtime.bobberMode = 'fighting';
}

function landFish(): void {
  const s = useGameStore.getState();
  const fish = runtime.fish;
  if (!fish) return;
  if (!s.transition('caught')) return;
  runtime.fish = null;
  runtime.fight = null;
  runtime.fightParams = null;
  runtime.reeling = false;
  runtime.giveLine = false;
  runtime.tensionRatio = 0;
  runtime.bobberMode = 'hanging';
  const pending = useGameStore.getState().registerCatch(fish);
  spawnSplash(player.position.x, 0, player.position.z, 1.1);
  sfx('catch');
  if (pending?.levelUp) {
    useGameStore.getState().notify(`Level up! You are now level ${pending.levelUp}`, 'level');
    sfx('levelup');
  }
}

export function resolveCatch(keep: boolean): void {
  const s = useGameStore.getState();
  if (s.fishingState !== 'caught' || !s.pendingCatch) return;
  const fish = s.pendingCatch.fish;
  s.resolveCatch(keep);
  s.transition('idle');
  if (keep) {
    s.notify(`+${fish.value} coins`, 'reward');
    sfx('coin');
  } else {
    s.notify('Released back into the lake.');
    sfx('splash');
  }
}

function tickWaiting(dt: number): void {
  if (runtime.waitPhase === 'waiting') {
    runtime.waitTimer -= dt;
    if (runtime.waitTimer <= 0) beginNibbling();
    return;
  }
  if (runtime.waitPhase === 'nibbling') {
    runtime.nibbleTimer -= dt;
    runtime.nibbleTick -= dt;
    if (runtime.nibbleTick <= 0) {
      runtime.nibble = 1;
      spawnRipple(bobber.position.x, bobber.position.z, 0.5, 0.9);
      sfx('nibble');
      runtime.nibbleTick = BITE.nibbleInterval * (0.7 + 0.6 * random());
    }
    if (runtime.nibbleTimer <= 0) doBite();
  }
}

function tickFight(dt: number): void {
  const fight = runtime.fight;
  const params = runtime.fightParams;
  if (!fight || !params) return;
  const outcome = stepFight(fight, params, { reeling: runtime.reeling, giveLine: runtime.giveLine }, dt, random);
  runtime.tensionRatio = fight.ratio;
  runtime.tension = fight.tension;
  runtime.fightDistance = fight.distance;
  runtime.fightProgress = fightProgress(fight);
  runtime.fightStamina = fight.stamina;
  runtime.fightPhase = fight.phase;

  if (fight.phase === 'pull' && runtime.lastPhase !== 'pull') {
    sfx('struggle');
    runtime.pullSplash = 0;
  }
  runtime.lastPhase = fight.phase;

  if (runtime.reeling && !runtime.giveLine) {
    runtime.reelTick -= dt;
    if (runtime.reelTick <= 0) {
      sfx('reel');
      runtime.reelTick = 0.085;
    }
  }
  if (fight.ratio >= FIGHT.warningRatio) {
    runtime.warnTick -= dt;
    if (runtime.warnTick <= 0) {
      sfx('warn');
      runtime.warnTick = 0.28;
    }
  } else {
    runtime.warnTick = 0;
  }

  if (outcome === 'landed') landFish();
  else if (outcome === 'escaped') finishEncounter('escaped', fight.reason);
  else if (outcome === 'broken') finishEncounter('lineBroken', fight.reason);
}

export function tickFishing(dt: number): void {
  if (dt <= 0) return;
  const state = useGameStore.getState().fishingState;
  if (runtime.nibble > 0) runtime.nibble = Math.max(0, runtime.nibble - dt * 3);
  if (runtime.whipTime >= 0) {
    runtime.whipTime += dt;
    if (runtime.whipTime > 2) runtime.whipTime = -1;
  }
  switch (state) {
    case 'preparing':
      runtime.charge = Math.min(1, runtime.charge + dt / CAST.chargeTime);
      break;
    case 'waiting':
      tickWaiting(dt);
      break;
    case 'bite':
      runtime.biteTimer -= dt;
      if (runtime.biteTimer <= 0) finishEncounter('escaped', 'Too slow. The fish took the bait and left.');
      break;
    case 'hooking':
      runtime.hookTimer -= dt;
      if (runtime.hookTimer <= 0) startFight();
      break;
    case 'fighting':
      tickFight(dt);
      break;
    case 'escaped':
    case 'lineBroken':
      runtime.endTimer -= dt;
      if (runtime.endTimer <= 0) endEncounter();
      break;
    default:
      break;
  }
}

export function primaryDown(): void {
  const s = useGameStore.getState();
  if (s.phase !== 'playing') return;
  switch (s.fishingState) {
    case 'idle':
      startCharge();
      break;
    case 'waiting':
    case 'bite':
      strike();
      break;
    case 'fighting':
      runtime.reeling = true;
      break;
    default:
      break;
  }
}

export function primaryUp(): void {
  runtime.reeling = false;
  releaseCharge();
}

export function secondaryDown(): void {
  if (useGameStore.getState().fishingState === 'fighting') runtime.giveLine = true;
}

export function secondaryUp(): void {
  runtime.giveLine = false;
}

export function quickSelectBait(index: number): void {
  const s = useGameStore.getState();
  if (s.phase !== 'playing') return;
  const bait = BAITS[index];
  if (!bait) return;
  if (s.fishingState !== 'idle' || runtime.bobberMode !== 'hanging') {
    s.notify('Reel in the line before changing bait.');
    return;
  }
  const result = s.selectBait(bait.id);
  if (!result.ok) {
    s.notify(`No ${bait.name.toLowerCase()} in your bag.`);
    sfx('error');
    return;
  }
  s.notify(`Bait: ${bait.name}`);
  sfx('ui');
}
