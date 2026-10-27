import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { cancelCharge, releaseCharge, retrieveLine, startCharge } from '../game/fishing/fishingEngine';
import { input } from '../game/player/input';
import { releaseLock } from '../services/pointerLock';

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight',
]);

/** Keyboard and mouse bindings. Renders nothing; listeners are removed on unmount. */
export function InputController() {
  useEffect(() => {
    const playing = () => useGameStore.getState().phase === 'playing';

    const onKeyDown = (e: KeyboardEvent) => {
      if (!playing()) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) startCharge();
      } else if (e.code === 'KeyR') {
        if (!e.repeat) retrieveLine();
      } else if (e.code === 'KeyP') {
        releaseLock(); // browser fires pointerlockchange -> pause menu
      } else if (MOVE_KEYS.has(e.code)) {
        e.preventDefault();
        input.keys.add(e.code);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      input.keys.delete(e.code);
      if (e.code === 'Space') releaseCharge();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && playing() && document.pointerLockElement) startCharge();
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) releaseCharge();
    };
    const onBlur = () => {
      input.keys.clear();
      cancelCharge();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onBlur);
      input.keys.clear();
    };
  }, []);

  return null;
}
