import { FIGHT } from './fishingConfig';
import type { FishSpecies } from '../data/fishSpecies';
import type { HookStats, LineStats, ReelStats, RodStats } from '../data/equipment';
import type { Rng } from './fishingTypes';
import { weightNorm } from './fishGeneration';

export interface FightParams {
  species: FishSpecies;
  weight: number;
  rod: RodStats;
  reel: ReelStats;
  line: LineStats;
  hook: HookStats;
}

export type FightPhase = 'rest' | 'pull';
export type FightOutcome = 'none' | 'landed' | 'escaped' | 'broken';

export interface FightState {
  distance: number;
  startDistance: number;
  stamina: number;
  phase: FightPhase;
  phaseTime: number;
  phaseDuration: number;
  tension: number;
  ratio: number;
  danger: number;
  slack: number;
  elapsed: number;
  closing: number;
  outcome: FightOutcome;
  reason: string;
}

export interface FightInput {
  reeling: boolean;
  giveLine: boolean;
}

export function fightCapacity(p: FightParams): number {
  return Math.min(p.line.breakStrength, p.rod.maxTension * FIGHT.capacityRodFactor);
}

export function fishForce(p: FightParams): number {
  const n = weightNorm(p.species, p.weight);
  return p.species.strength * (0.5 + 0.5 * Math.pow(n, 0.7));
}

export function staminaSeconds(p: FightParams): number {
  const n = weightNorm(p.species, p.weight);
  return p.species.stamina * (0.55 + 0.9 * n);
}

function rollPhase(p: FightParams, phase: FightPhase, stamina: number, rng: Rng): number {
  const s = p.species;
  if (phase === 'pull') {
    const base = s.pullMin + (s.pullMax - s.pullMin) * rng();
    return base * (0.55 + 0.45 * stamina);
  }
  const base = s.restMin + (s.restMax - s.restMin) * rng();
  return base * (1 + (1 - stamina) * 0.8);
}

export function createFight(p: FightParams, startDistance: number, rng: Rng): FightState {
  const d = Math.min(FIGHT.maxStartDistance, Math.max(FIGHT.minStartDistance, startDistance));
  return {
    distance: d,
    startDistance: d,
    stamina: 1,
    phase: 'rest',
    phaseTime: 0,
    phaseDuration: 0.6 + rng() * 0.6,
    tension: 0,
    ratio: 0,
    danger: 0,
    slack: 0,
    elapsed: 0,
    closing: 0,
    outcome: 'none',
    reason: '',
  };
}

export function fightProgress(f: FightState): number {
  return Math.min(1, Math.max(0, 1 - (f.distance - FIGHT.landDistance) / (f.startDistance - FIGHT.landDistance)));
}

export function stepFight(f: FightState, p: FightParams, input: FightInput, dt: number, rng: Rng): FightOutcome {
  if (f.outcome !== 'none' || dt <= 0) return f.outcome;

  f.elapsed += dt;
  f.phaseTime += dt;
  if (f.phaseTime >= f.phaseDuration) {
    f.phase = f.phase === 'rest' ? 'pull' : 'rest';
    f.phaseTime = 0;
    f.phaseDuration = rollPhase(p, f.phase, f.stamina, rng);
  }

  const pulling = f.phase === 'pull';
  const capacity = fightCapacity(p);
  const tired = FIGHT.tiredFloor + (1 - FIGHT.tiredFloor) * f.stamina;
  const surge = 1 + 0.1 * Math.sin(f.elapsed * 7.3) + 0.06 * Math.sin(f.elapsed * 13.1);
  const force = fishForce(p) * tired * (pulling ? 1 : FIGHT.restForce) * surge;
  const reelLoad = input.reeling && !input.giveLine ? FIGHT.reelLoad + FIGHT.reelLoadSpeed * p.reel.speed : 0;

  const reelingNow = input.reeling && !input.giveLine;
  let target = force * (reelingNow ? 1 + FIGHT.reelPullMultiplier : 1) + reelLoad;
  if (input.giveLine) target *= FIGHT.giveLineRelief;

  let payout = 0;
  if (target > p.reel.drag) {
    const excess = target - p.reel.drag;
    target = p.reel.drag + excess * FIGHT.dragSlip;
    payout = excess * FIGHT.dragPayout;
  }

  f.tension += (target - f.tension) * (1 - Math.exp(-FIGHT.tensionResponse * dt));
  f.ratio = f.tension / capacity;

  let closing = 0;
  if (input.reeling && !input.giveLine) {
    const factor = pulling ? FIGHT.pullClosingFactor : FIGHT.restClosingFactor;
    closing = p.reel.speed * p.reel.efficiency * factor * (1.15 - 0.6 * f.stamina);
  }
  const run = pulling ? p.species.runSpeed * (0.4 + 0.6 * f.stamina) * (input.reeling ? 0.6 : 1) : 0;
  const give = input.giveLine ? FIGHT.giveLineRate : 0;
  const net = closing - run - payout - give;
  f.closing = net;
  f.distance -= net * dt;

  const stamTime = staminaSeconds(p);
  const pressure = 0.6 + 1.2 * Math.min(1, Math.max(0, f.ratio));
  if (pulling) {
    f.stamina -= (dt / stamTime) * FIGHT.staminaDrainPull * pressure;
  } else {
    f.stamina -= (dt / stamTime) * FIGHT.staminaDrainRest * pressure;
    if (f.ratio < 0.4) f.stamina += dt * FIGHT.staminaRecover;
  }
  f.stamina = Math.min(1, Math.max(0, f.stamina));

  if (f.ratio > 1) f.danger += dt;
  else if (f.ratio < 0.95) f.danger = Math.max(0, f.danger - dt * FIGHT.dangerRecover);

  if (f.ratio > 1 && f.ratio >= FIGHT.instantBreakRatio) f.danger = FIGHT.dangerBreakTime;

  if (pulling && f.ratio < FIGHT.slackRatio && !input.giveLine) f.slack += dt;
  else f.slack = Math.max(0, f.slack - dt * 0.5);

  if (f.danger >= FIGHT.dangerBreakTime) {
    f.outcome = 'broken';
    f.reason = 'The line snapped under too much tension.';
  } else if (f.slack > FIGHT.slackLimit * p.hook.hold) {
    f.outcome = 'escaped';
    f.reason = 'The line went slack and the fish shook the hook loose.';
  } else if (f.distance > f.startDistance * FIGHT.lineOutFactor + FIGHT.lineOutBonus) {
    f.outcome = 'escaped';
    f.reason = 'The fish ran out all your line and got away.';
  } else if (f.distance <= FIGHT.landDistance) {
    f.distance = FIGHT.landDistance;
    f.outcome = 'landed';
  }
  return f.outcome;
}
