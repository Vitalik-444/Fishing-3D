import type { BobberMode } from './fishingTypes';

/**
 * High-frequency fishing values. Plain mutable object on purpose: read inside the render loop
 * and by the HUD's own rAF loop, never subscribed to by React, so nothing re-renders per frame.
 */
export const runtime = {
  charge: 0, // 0..1 while the player holds the cast button
  castPower: 0, // power locked in at release
  whipTime: -1, // seconds since release; -1 when the rod is at rest
  bobberMode: 'hanging' as BobberMode,
};

export function resetRuntime(): void {
  runtime.charge = 0;
  runtime.castPower = 0;
  runtime.whipTime = -1;
  runtime.bobberMode = 'hanging';
}
