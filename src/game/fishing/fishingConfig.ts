export const CAST = {
  chargeTime: 1.25,
  minCharge: 0.1,
  releaseTime: 0.16,
  minSpeed: 7,
  maxSpeed: 23,
  gravity: 9.81,
  drag: 0.06,
  baseElevation: 0.62,
  pitchInfluence: 0.45,
  minElevation: 0.38,
  maxElevation: 0.95,
  maxFlightTime: 8,
} as const;

export const RETRIEVE = {
  speed: 9,
  arriveDistance: 2.4,
  groundHold: 1.2,
  hangLength: 0.55,
} as const;

export const BITE = {
  meanWait: 6.5,
  minWait: 2.5,
  maxWait: 15,
  referenceWeight: 3,
  minActivity: 0.4,
  maxActivity: 2.4,
  nibbleMin: 1.3,
  nibbleMax: 2.7,
  nibbleInterval: 0.55,
  baseWindow: 1.5,
  minWindow: 0.7,
  spookDelay: 4,
  hookDelay: 0.45,
  lateTimingFloor: 0.72,
  minHookChance: 0.25,
  maxHookChance: 0.97,
  endDelay: 1.7,
  shallowDepth: 1.2,
  deepDepth: 3,
} as const;

export const FIGHT = {
  landDistance: 1.6,
  minStartDistance: 9,
  maxStartDistance: 70,
  capacityRodFactor: 1.3,
  reelLoad: 1.6,
  reelLoadSpeed: 0.18,
  reelPullMultiplier: 0.9,
  tensionResponse: 6,
  dragSlip: 0.6,
  dragPayout: 0.5,
  giveLineRate: 1.6,
  giveLineRelief: 0.2,
  restForce: 0.28,
  pullClosingFactor: 0.25,
  restClosingFactor: 0.9,
  staminaDrainPull: 1,
  staminaDrainRest: 0.15,
  staminaRecover: 0.02,
  tiredFloor: 0.35,
  dangerBreakTime: 0.55,
  dangerRecover: 1.5,
  instantBreakRatio: 1.4,
  warningRatio: 0.8,
  slackRatio: 0.07,
  slackLimit: 3.2,
  lineOutFactor: 1.5,
  lineOutBonus: 6,
  lostFightBeforeLand: 0.5,
} as const;

export const REWARD = {
  trophyThreshold: 0.85,
  trophyBonus: 0.5,
  weightExponent: 2.4,
  xpWeightBonus: 0.8,
  releaseMoneyFactor: 0,
} as const;

export const STARTER_BAIT_STOCK: Record<string, number> = {
  bait_worms: 20,
  bait_bread: 10,
};
export const STARTER_BAIT_ID = 'bait_worms';
