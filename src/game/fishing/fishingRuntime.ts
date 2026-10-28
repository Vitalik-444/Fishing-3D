import type { BobberMode, FishInstance, WaitPhase } from './fishingTypes';
import type { FightParams, FightPhase, FightState } from './fishFight';
import type { SpeciesWeight } from './biteSystem';

export const runtime = {
  charge: 0,
  castPower: 0,
  whipTime: -1,
  bobberMode: 'hanging' as BobberMode,

  waitPhase: 'none' as WaitPhase,
  waitTimer: 0,
  nibbleTimer: 0,
  nibbleTick: 0,
  nibble: 0,
  weights: [] as SpeciesWeight[],

  biteTimer: 0,
  biteWindow: 1.5,
  hookTimer: 0,
  endTimer: 0,

  fish: null as FishInstance | null,
  fightParams: null as FightParams | null,
  fight: null as FightState | null,
  reeling: false,
  giveLine: false,
  tensionRatio: 0,
  tension: 0,
  capacity: 1,
  fightDistance: 0,
  fightStart: 1,
  fightProgress: 0,
  fightStamina: 1,
  fightPhase: 'rest' as FightPhase,
  fightDirX: 0,
  fightDirZ: -1,
  lastPhase: 'rest' as FightPhase,

  reelTick: 0,
  warnTick: 0,
  pullSplash: 0,
};

export function resetRuntime(): void {
  runtime.charge = 0;
  runtime.castPower = 0;
  runtime.whipTime = -1;
  runtime.bobberMode = 'hanging';
  runtime.waitPhase = 'none';
  runtime.waitTimer = 0;
  runtime.nibbleTimer = 0;
  runtime.nibbleTick = 0;
  runtime.nibble = 0;
  runtime.weights = [];
  runtime.biteTimer = 0;
  runtime.biteWindow = 1.5;
  runtime.hookTimer = 0;
  runtime.endTimer = 0;
  runtime.fish = null;
  runtime.fightParams = null;
  runtime.fight = null;
  runtime.reeling = false;
  runtime.giveLine = false;
  runtime.tensionRatio = 0;
  runtime.tension = 0;
  runtime.capacity = 1;
  runtime.fightDistance = 0;
  runtime.fightStart = 1;
  runtime.fightProgress = 0;
  runtime.fightStamina = 1;
  runtime.fightPhase = 'rest';
  runtime.lastPhase = 'rest';
  runtime.reelTick = 0;
  runtime.warnTick = 0;
  runtime.pullSplash = 0;
}
