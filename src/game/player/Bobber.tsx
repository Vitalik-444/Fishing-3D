import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { runtime } from '../fishing/fishingRuntime';
import { CAST, RETRIEVE } from '../fishing/fishingConfig';
import { launchVelocity, stepProjectile } from '../fishing/casting';
import { onSplashdown, retrieveLine } from '../fishing/fishingEngine';
import { gearOf } from '../fishing/gear';
import { spawnRipple, spawnSplash } from '../effects';
import { terrainHeight } from '../world/terrain';
import { waveHeight } from '../world/waves';
import { bobber, player, rig } from './playerState';

const target = new THREE.Vector3();

export function Bobber() {
  const group = useRef<THREE.Group>(null);
  const ready = useRef(false);
  const flight = useRef(0);
  const groundTimer = useRef(0);
  const rippleTimer = useRef(0);
  const trailTimer = useRef(0);
  const pullTimer = useRef(0);

  const assets = useMemo(() => {
    const white = new THREE.MeshStandardMaterial({ color: '#f1ecde', roughness: 0.4 });
    const red = new THREE.MeshStandardMaterial({ color: '#d9432a', roughness: 0.4 });
    const bottom = new THREE.SphereGeometry(0.07, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const top = new THREE.SphereGeometry(0.07, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const stick = new THREE.CylinderGeometry(0.008, 0.012, 0.2, 8);
    const tip = new THREE.CylinderGeometry(0.013, 0.009, 0.05, 8);
    return { white, red, bottom, top, stick, tip };
  }, []);
  useEffect(() => () => Object.values(assets).forEach((a) => a.dispose()), [assets]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const gs = useGameStore.getState();
    const dt = gs.phase === 'playing' ? Math.min(delta, 0.05) : 0;
    const t = state.clock.elapsedTime;
    const pos = bobber.position;
    const vel = bobber.velocity;

    if (!ready.current) {
      pos.set(rig.tip.x, rig.tip.y - RETRIEVE.hangLength, rig.tip.z);
      ready.current = true;
    }

    let tiltX = 0;
    let tiltZ = 0;

    switch (runtime.bobberMode) {
      case 'hanging': {
        const swing = Math.sin(t * 2.1) * 0.02;
        target.set(rig.tip.x + swing, rig.tip.y - RETRIEVE.hangLength, rig.tip.z);
        pos.lerp(target, dt > 0 ? 1 - Math.exp(-dt * 12) : 0);
        if (gs.fishingState === 'casting' && runtime.whipTime >= CAST.releaseTime) {
          pos.copy(rig.tip);
          const castPower = gearOf(gs.profile).rod.stats.castPower;
          launchVelocity(player.yaw, player.pitch, runtime.castPower, castPower, vel);
          flight.current = 0;
          runtime.bobberMode = 'flying';
        }
        break;
      }

      case 'flying': {
        if (dt <= 0) break;
        stepProjectile(pos, vel, dt);
        flight.current += dt;
        tiltX = Math.atan2(vel.y, 12) * 0.4;
        const wh = waveHeight(pos.x, pos.z, t);
        const gh = terrainHeight(pos.x, pos.z);
        if (pos.y <= Math.max(gh, wh) && vel.y < 0) {
          if (gh < wh - 0.02) {
            pos.y = wh;
            vel.set(0, 0, 0);
            runtime.bobberMode = 'floating';
            rippleTimer.current = 1.6;
            spawnRipple(pos.x, pos.z, 2.4, 1.9);
            spawnRipple(pos.x, pos.z, 1.3, 1.2);
            spawnSplash(pos.x, wh, pos.z, 1);
            onSplashdown();
          } else {
            pos.y = gh + 0.05;
            vel.set(0, 0, 0);
            runtime.bobberMode = 'grounded';
            groundTimer.current = 0;
            gs.notify('Too short. The cast landed on the shore.');
          }
        } else if (flight.current > CAST.maxFlightTime) {
          pos.y = Math.max(gh, wh);
          runtime.bobberMode = 'grounded';
          groundTimer.current = RETRIEVE.groundHold;
        }
        break;
      }

      case 'floating': {
        const st = gs.fishingState;
        const wave = waveHeight(pos.x, pos.z, t);
        let y = wave + Math.sin(t * 3.1) * 0.006;
        tiltX = Math.cos(t * 1.3) * 0.05;
        tiltZ = Math.sin(t * 1.7) * 0.06;
        if (st === 'bite' || st === 'hooking') {
          y -= 0.11 + Math.abs(Math.sin(t * 14)) * 0.05;
          tiltX += 0.45;
          tiltZ += Math.sin(t * 22) * 0.12;
          if (dt > 0) {
            rippleTimer.current -= dt;
            if (rippleTimer.current <= 0) {
              spawnRipple(pos.x, pos.z, 0.9, 0.9);
              rippleTimer.current = 0.35;
            }
          }
        } else {
          y -= runtime.nibble * 0.045;
          tiltX += runtime.nibble * 0.25;
          rippleTimer.current -= dt;
          if (dt > 0 && rippleTimer.current <= 0) {
            spawnRipple(pos.x, pos.z, 0.7, 1.8);
            rippleTimer.current = 1.8 + Math.random() * 1.4;
          }
        }
        pos.y = dt > 0 ? pos.y + (y - pos.y) * (1 - Math.exp(-dt * 24)) : pos.y;
        break;
      }

      case 'fighting': {
        const d = runtime.fightDistance;
        const pull = runtime.fightPhase === 'pull';
        const swing = Math.sin(t * (pull ? 5.5 : 2.4)) * (pull ? 1.8 : 0.6) * Math.min(1, Math.max(0, d - 2) / 10);
        const px = player.position.x + runtime.fightDirX * d - runtime.fightDirZ * swing;
        const pz = player.position.z + runtime.fightDirZ * d + runtime.fightDirX * swing;
        const k = dt > 0 ? 1 - Math.exp(-dt * 14) : 0;
        pos.x += (px - pos.x) * k;
        pos.z += (pz - pos.z) * k;
        const wh = waveHeight(pos.x, pos.z, t);
        const gh = terrainHeight(pos.x, pos.z);
        const ty = Math.max(gh, wh) + 0.02 - (pull ? 0.07 : 0.02);
        pos.y += (ty - pos.y) * k;
        tiltX = pull ? 0.5 + Math.sin(t * 20) * 0.1 : 0.15;
        tiltZ = Math.sin(t * 9) * (pull ? 0.25 : 0.08);
        if (dt > 0) {
          pullTimer.current -= dt;
          if (pullTimer.current <= 0 && gh < wh) {
            spawnRipple(pos.x, pos.z, pull ? 1.2 : 0.6, pull ? 0.9 : 1.1);
            if (pull) spawnSplash(pos.x, wh, pos.z, 0.5);
            pullTimer.current = pull ? 0.28 : 0.7;
          }
        }
        break;
      }

      case 'grounded': {
        groundTimer.current += dt;
        if (groundTimer.current >= RETRIEVE.groundHold) retrieveLine();
        break;
      }

      case 'retrieving': {
        if (dt <= 0) break;
        const dx = rig.tip.x - pos.x;
        const dz = rig.tip.z - pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > RETRIEVE.arriveDistance) {
          const step = Math.min(dist, RETRIEVE.speed * dt);
          pos.x += (dx / dist) * step;
          pos.z += (dz / dist) * step;
          const wh = waveHeight(pos.x, pos.z, t);
          const gh = terrainHeight(pos.x, pos.z);
          pos.y = Math.max(gh, wh) + 0.03;
          trailTimer.current -= dt;
          if (gh < wh && trailTimer.current <= 0) {
            spawnRipple(pos.x, pos.z, 0.55, 0.9);
            trailTimer.current = 0.3;
          }
        } else {
          runtime.bobberMode = 'hanging';
          gs.setRetrieving(false);
        }
        break;
      }
    }

    g.position.copy(pos);
    g.rotation.set(tiltX, 0, tiltZ);
  });

  return (
    <group ref={group}>
      <mesh geometry={assets.bottom} material={assets.white} />
      <mesh geometry={assets.top} material={assets.red} />
      <mesh geometry={assets.stick} material={assets.white} position={[0, 0.16, 0]} />
      <mesh geometry={assets.tip} material={assets.red} position={[0, 0.235, 0]} />
    </group>
  );
}
