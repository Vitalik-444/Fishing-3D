import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  cancelCharge,
  cancelHeldInputs,
  primaryDown,
  primaryUp,
  quickSelectBait,
  resolveCatch,
  retrieveLine,
  secondaryDown,
  secondaryUp,
} from '../game/fishing/fishingEngine';
import { input } from '../game/player/input';
import { releaseLock } from '../services/pointerLock';
import { unlockAudio } from '../services/audio';
import { useSettingsStore } from '../store/settingsStore';

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight',
]);

export function InputController() {
  useEffect(() => {
    const playing = () => useGameStore.getState().phase === 'playing';

    const onKeyDown = (e: KeyboardEvent) => {
      unlockAudio();
      if (!playing()) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) primaryDown();
      } else if (e.code === 'KeyF') {
        if (!e.repeat) secondaryDown();
      } else if (e.code === 'KeyR') {
        if (!e.repeat) retrieveLine();
      } else if (e.code === 'KeyE') {
        if (!e.repeat) resolveCatch(true);
      } else if (e.code === 'KeyQ') {
        if (!e.repeat) resolveCatch(false);
      } else if (/^Digit[1-9]$/.test(e.code)) {
        if (!e.repeat) quickSelectBait(Number(e.code.slice(5)) - 1);
      } else if (e.code === 'KeyH') {
        if (!e.repeat) {
          const st = useSettingsStore.getState();
          st.setShowHints(!st.showHints);
        }
      } else if (e.code === 'KeyP') {
        releaseLock();
      } else if (MOVE_KEYS.has(e.code)) {
        e.preventDefault();
        input.keys.add(e.code);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      input.keys.delete(e.code);
      if (e.code === 'Space') primaryUp();
      else if (e.code === 'KeyF') secondaryUp();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!playing() || !document.pointerLockElement) return;
      if (e.button === 0) primaryDown();
      else if (e.button === 2) secondaryDown();
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) primaryUp();
      else if (e.button === 2) secondaryUp();
    };
    const onContextMenu = (e: MouseEvent) => {
      if (document.pointerLockElement) e.preventDefault();
    };
    const onBlur = () => {
      input.keys.clear();
      cancelCharge();
      cancelHeldInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', onBlur);
      input.keys.clear();
    };
  }, []);

  return null;
}
