import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { cancelCharge } from '../game/fishing/fishingEngine';
import { getLockTarget, releaseLock } from '../services/pointerLock';
import { input } from '../game/player/input';

/**
 * Single source of truth for "is the mouse captured?". Locked -> playing. Unlocked while playing
 * (Esc, P, alt-tab) -> paused, so gameplay timers stop and the cursor comes back for the menus.
 */
export function PointerLockManager() {
  useEffect(() => {
    const onChange = () => {
      const store = useGameStore.getState();
      const target = getLockTarget();
      if (target && document.pointerLockElement === target) {
        store.setLockMessage(null);
        store.setPhase('playing');
      } else if (store.phase === 'playing') {
        cancelCharge();
        input.keys.clear();
        store.setPhase('paused');
      }
    };
    const onError = () =>
      useGameStore
        .getState()
        .setLockMessage('The browser blocked mouse capture. Wait a second and click again.');
    const onHidden = () => {
      if (document.hidden) releaseLock();
    };

    document.addEventListener('pointerlockchange', onChange);
    document.addEventListener('pointerlockerror', onError);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('pointerlockchange', onChange);
      document.removeEventListener('pointerlockerror', onError);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, []);

  return null;
}
