import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { runtime } from '../fishing/fishingRuntime';
import { tickFishing } from '../fishing/fishingEngine';
import { clamp, damp } from '../world/math';
import { EYE_HEIGHT, WALK_BOUNDS, WALK_MIN_HEIGHT, terrainHeight } from '../world/terrain';
import { input } from './input';
import { player } from './playerState';

const PITCH_MIN = -1.2; // look down ~69 degrees
const PITCH_MAX = 0.95; // look up ~54 degrees
const WALK_SPEED = 2.4;
const RUN_SPEED = 4.2;

/**
 * First-person camera: mouse look (pointer lock), smoothed rotation, and gentle shore walking.
 * IMPORTANT: this component is mounted before FishingRod/Bobber/FishingLine; R3F runs useFrame
 * callbacks in mount order, so the camera and fishing timers are up to date before they read them.
 */
export function FirstPersonController() {
  const camera = useThree((s) => s.camera);
  const yawTarget = useRef(player.yaw);
  const pitchTarget = useRef(player.pitch);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    const onMove = (e: MouseEvent) => {
      if (useGameStore.getState().phase !== 'playing' || !document.pointerLockElement) return;
      const k = useSettingsStore.getState().mouseSensitivity * 0.0021;
      const mx = clamp(e.movementX, -200, 200); // some browsers emit huge spikes right after locking
      const my = clamp(e.movementY, -200, 200);
      yawTarget.current -= mx * k;
      pitchTarget.current = clamp(pitchTarget.current - my * k, PITCH_MIN, PITCH_MAX);
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [camera]);

  useFrame((_, delta) => {
    const active = useGameStore.getState().phase === 'playing';
    const dt = active ? Math.min(delta, 0.05) : 0;

    tickFishing(dt);

    if (dt > 0) {
      player.yaw = damp(player.yaw, yawTarget.current, 32, dt);
      player.pitch = damp(player.pitch, pitchTarget.current, 32, dt);

      // Walking is only allowed with the line in (nobody walks away from a cast rod).
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
        // Try each axis separately so the player slides along the waterline instead of sticking.
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
