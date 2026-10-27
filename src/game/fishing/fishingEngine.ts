import { useGameStore } from '../../store/gameStore';
import { CAST } from './fishingConfig';
import { runtime } from './fishingRuntime';

/**
 * Player-facing fishing actions. They only touch the store + runtime numbers (no three.js),
 * so the rules stay separate from rendering. Every action validates the current state first.
 */

/** Hold the cast button: start charging power. */
export function startCharge(): void {
  const s = useGameStore.getState();
  if (s.phase !== 'playing') return;
  if (s.fishingState !== 'idle' || runtime.bobberMode !== 'hanging') return; // can't cast mid-cast / mid-retrieve
  if (!s.transition('preparing')) return;
  runtime.charge = 0;
  runtime.whipTime = -1;
}

/** Release the cast button: throw (or cancel if barely charged). */
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
  s.transition('casting');
}

/** Abort a charge without casting (pause, focus loss). */
export function cancelCharge(): void {
  const s = useGameStore.getState();
  if (s.fishingState === 'preparing') {
    runtime.charge = 0;
    s.transition('idle');
  }
}

/** Reel the bobber back in. Only legal once it is out (floating on the water, or stranded on shore). */
export function retrieveLine(): void {
  const s = useGameStore.getState();
  if (s.phase !== 'playing') return;
  if (runtime.bobberMode !== 'floating' && runtime.bobberMode !== 'grounded') return;
  if (!s.transition('idle')) return; // later milestones: not allowed during a bite or fight
  runtime.bobberMode = 'retrieving';
  s.setRetrieving(true);
}

/** Advance charge and rod-whip timers. dt is 0 while paused, so timers freeze with the game. */
export function tickFishing(dt: number): void {
  if (dt <= 0) return;
  const state = useGameStore.getState().fishingState;
  if (state === 'preparing') {
    runtime.charge = Math.min(1, runtime.charge + dt / CAST.chargeTime);
  }
  if (runtime.whipTime >= 0) {
    runtime.whipTime += dt;
    if (runtime.whipTime > 2) runtime.whipTime = -1; // rod fully recovered
  }
}
