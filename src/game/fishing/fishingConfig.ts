/** Tunable numbers for casting and retrieving. */
export const CAST = {
  chargeTime: 1.25, // seconds from empty to full power
  minCharge: 0.1, // below this a release cancels the cast
  releaseTime: 0.16, // seconds after release when the bobber leaves the rod tip
  minSpeed: 7, // m/s at zero power
  maxSpeed: 23, // m/s at full power (about 50 m on flat ground)
  gravity: 9.81,
  drag: 0.06, // horizontal air drag per second
  baseElevation: 0.62, // rad, launch angle when looking at the horizon
  pitchInfluence: 0.45, // how much looking up/down changes the launch angle
  minElevation: 0.38,
  maxElevation: 0.95,
  maxFlightTime: 8,
} as const;

export const RETRIEVE = {
  speed: 9, // m/s the bobber travels back
  arriveDistance: 2.4, // horizontal distance from the rod tip where it lifts off the water
  groundHold: 1.2, // seconds a cast that landed on shore stays before auto-retrieving
  hangLength: 0.55, // how far the bobber dangles below the rod tip
} as const;

export const STARTER_ROD = { id: 'rod_basic', name: 'Basic Rod', castPower: 1 } as const;
export const STARTER_BAIT = { id: 'bait_worms', name: 'Worms', count: 20 } as const;
