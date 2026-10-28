import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { runtime } from '../fishing/fishingRuntime';
import { tickFishing } from '../fishing/fishingEngine';
import { clamp, damp, lerp } from '../world/math';
import { EYE_HEIGHT, WALK_BOUNDS, WALK_MIN_HEIGHT, terrainHeight } from '../world/terrain';
import { input } from './input';
import { player } from './playerState';

const PITCH_MIN = -1.2;
const PITCH_MAX = 0.95;
const WALK_SPEED = 2.4;
const RUN_SPEED = 4.2;

export function FirstPersonController() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const yawTarget = useRef(player.yaw);
  const pitchTarget = useRef(player.pitch);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const onMove = (e: MouseEvent) => {
      if (useGameStore.getState().phase !== 'playing' || !document.pointerLockElement) return;
      const k = useSettingsStore.getState().mouseSensitivity * 0.0021;
      const mx = clamp(e.movementX, -200, 200);
      const my = clamp(e.movementY, -200, 200);
      yawTarget.current -= mx * k;
      pitchTarget.current = clamp(pitchTarget.current - my * k, PITCH_MIN, PITCH_MAX);
    };
    document.addEventListener('mousemove', onMove);

    const el = gl.domElement;
    let touchId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (touchId !== null) return;
      const t = e.changedTouches[0];
      touchId = t.identifier;
      lastX = t.clientX;
      lastY = t.clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchId === null || useGameStore.getState().phase !== 'playing') return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== touchId) continue;
        e.preventDefault();
        const k = useSettingsStore.getState().mouseSensitivity * 0.0034;
        yawTarget.current -= (t.clientX - lastX) * k;
        pitchTarget.current = clamp(pitchTarget.current - (t.clientY - lastY) * k, PITCH_MIN, PITCH_MAX);
        lastX = t.clientX;
        lastY = t.clientY;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchId) touchId = null;
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const active = useGameStore.getState().phase === 'playing';
    const dt = active ? Math.min(delta, 0.05) : 0;

    tickFishing(dt);

    if (dt > 0) {
      const rate = lerp(70, 14, useSettingsStore.getState().cameraSmoothing);
      player.yaw = damp(player.yaw, yawTarget.current, rate, dt);
      player.pitch = damp(player.pitch, pitchTarget.current, rate, dt);

      const canMove = runtime.bobberMode === 'hanging' && useGameStore.getState().fishingState === 'idle';
      const k = input.keys;
      const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      const str = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      let moving = false;
      if (canMove && (fwd !== 0 || str !== 0)) {
        const len = Math.hypot(fwd, str);
        const speed = (k.has('ShiftLeft') || k.has('ShiftRight') ? RUN_SPEED : WALK_SPEED) * dt;
        const sin = Math.sin(player.yaw);
        const cos = Math.cos(player.yaw);
        const dx = ((-sin * fwd + cos * str) / len) * speed;
        const dz = ((-cos * fwd - sin * str) / len) * speed;
        const tryMove = (nx: number, nz: number) => {
          if (Math.abs(nx) > WALK_BOUNDS.x || nz > WALK_BOUNDS.zMax) return;
          if (terrainHeight(nx, nz) < WALK_MIN_HEIGHT) return;
          player.position.x = nx;
          player.position.z = nz;
          moving = true;
        };
        tryMove(player.position.x + dx, player.position.z);
        tryMove(player.position.x, player.position.z + dz);
      }
      player.bobPhase += moving ? dt * 8 : 0;
      player.bob = damp(player.bob, moving ? Math.sin(player.bobPhase) * 0.03 : 0, 10, dt);

      const eye = terrainHeight(player.position.x, player.position.z) + EYE_HEIGHT;
      player.position.y = damp(player.position.y, eye, 12, dt);
    }

    camera.position.set(player.position.x, player.position.y + player.bob, player.position.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
  });

  return null;
}
