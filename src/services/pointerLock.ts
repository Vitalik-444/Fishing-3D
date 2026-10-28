import { useGameStore } from '../store/gameStore';
import { unlockAudio } from './audio';

let target: HTMLElement | null = null;

export function registerLockTarget(el: HTMLElement | null): void {
  target = el;
}
export function getLockTarget(): HTMLElement | null {
  return target;
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

export function requestLock(): void {
  unlockAudio();
  const el = target;
  const store = useGameStore.getState();
  if (isTouchDevice()) {
    store.setLockMessage(null);
    store.setPhase('playing');
    return;
  }
  if (!el || typeof el.requestPointerLock !== 'function') {
    store.setLockMessage('This browser cannot capture the mouse. Open the game in a desktop browser.');
    return;
  }
  store.setLockMessage(null);
  try {
    const result: unknown = el.requestPointerLock();
    if (result instanceof Promise) {
      result.catch(() =>
        useGameStore
          .getState()
          .setLockMessage('The browser needs a moment before it can capture the mouse again. Click once more.'),
      );
    }
  } catch {
    store.setLockMessage('Could not capture the mouse. Click once more.');
  }
}

export function releaseLock(): void {
  if (document.pointerLockElement) document.exitPointerLock();
  else if (useGameStore.getState().phase === 'playing' && isTouchDevice()) useGameStore.getState().setPhase('paused');
}
