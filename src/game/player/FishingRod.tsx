import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { runtime } from '../fishing/fishingRuntime';
import { CAST } from '../fishing/fishingConfig';
import { lerp } from '../world/math';
import { player, rig } from './playerState';

const SEGMENTS = 6;
const SEG_LEN = 0.4;
const R_BASE = 0.0135;
const R_TIP = 0.0035;
const REST_TILT = 0.42;

const radiusAt = (i: number) => lerp(R_BASE, R_TIP, i / SEGMENTS);

function Segment({
  index, refs, tipRef, material,
}: {
  index: number;
  refs: MutableRefObject<(THREE.Group | null)[]>;
  tipRef: RefObject<THREE.Object3D>;
  material: THREE.Material;
}) {
  return (
    <group ref={(g) => { refs.current[index] = g; }}>
      <mesh position={[0, SEG_LEN / 2, 0]} material={material}>
        <cylinderGeometry args={[radiusAt(index + 1), radiusAt(index), SEG_LEN, 8, 1]} />
      </mesh>
      <group position={[0, SEG_LEN, 0]}>
        {index < SEGMENTS - 1 ? (
          <Segment index={index + 1} refs={refs} tipRef={tipRef} material={material} />
        ) : (
          <object3D ref={tipRef as RefObject<THREE.Object3D>} />
        )}
      </group>
    </group>
  );
}

export function FishingRod() {
  const camera = useThree((s) => s.camera);
  const root = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const segs = useRef<(THREE.Group | null)[]>([]);
  const tipRef = useRef<THREE.Object3D>(null);
  const anim = useRef({ tilt: REST_TILT, bend: 0, bendVel: 0 });

  const mats = useMemo(
    () => ({
      blank: new THREE.MeshStandardMaterial({ color: '#1b2a24', roughness: 0.35, metalness: 0.25 }),
      cork: new THREE.MeshStandardMaterial({ color: '#a07d50', roughness: 0.92 }),
      grip: new THREE.MeshStandardMaterial({ color: '#2a2c2b', roughness: 0.8 }),
      metal: new THREE.MeshStandardMaterial({ color: '#b3b8bd', roughness: 0.3, metalness: 0.85 }),
      gold: new THREE.MeshStandardMaterial({ color: '#c8a24b', roughness: 0.4, metalness: 0.7 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  useEffect(() => { if (pivot.current) pivot.current.rotation.order = 'YXZ'; }, []);

  useFrame((state, delta) => {
    const r = root.current;
    const p = pivot.current;
    if (!r || !p) return;
    const gs = useGameStore.getState();
    const dt = gs.phase === 'playing' ? Math.min(delta, 0.05) : 0;
    const a = anim.current;

    let targetTilt = REST_TILT;
    let tiltRate = 8;
    let bendTarget = 0;
    const t0 = state.clock.elapsedTime;
    if (gs.fishingState === 'preparing') {
      targetTilt = REST_TILT + 0.66 * runtime.charge;
      tiltRate = 10;
      bendTarget = 0.045 * runtime.charge;
    } else if (runtime.whipTime >= 0) {
      if (runtime.whipTime < CAST.releaseTime) {
        targetTilt = 0.22;
        tiltRate = 26;
        bendTarget = -0.1;
      } else {
        tiltRate = 6;
      }
    } else if (gs.fishingState === 'waiting') {
      bendTarget = runtime.nibble * 0.035;
    } else if (gs.fishingState === 'bite') {
      targetTilt = REST_TILT + 0.04;
      bendTarget = 0.03 + Math.abs(Math.sin(t0 * 16)) * 0.03;
    } else if (gs.fishingState === 'hooking') {
      targetTilt = REST_TILT + 0.8;
      tiltRate = 22;
      bendTarget = 0.12;
    } else if (gs.fishingState === 'fighting') {
      const ratio = Math.min(1.15, runtime.tensionRatio);
      const pull = runtime.fightPhase === 'pull';
      targetTilt = REST_TILT + 0.5 - 0.12 * ratio + (pull ? Math.sin(t0 * 9) * 0.035 : 0);
      tiltRate = 9;
      bendTarget = 0.06 + 0.32 * ratio + (pull ? Math.sin(t0 * 18) * 0.025 : 0);
    }

    if (dt > 0) {
      a.tilt += (targetTilt - a.tilt) * (1 - Math.exp(-tiltRate * dt));
      a.bendVel += ((bendTarget - a.bend) * 250 - a.bendVel * 14) * dt;
      a.bend += a.bendVel * dt;
    }

    r.position.copy(camera.position);
    r.quaternion.copy(camera.quaternion);

    const t = state.clock.elapsedTime;
    p.position.set(0.24, -0.3 + player.bob * 0.6 + Math.sin(t * 1.3) * 0.003, -0.42);
    p.rotation.set(-(Math.PI / 2 - a.tilt), 0.07, 0);

    for (let i = 0; i < SEGMENTS; i++) {
      const g = segs.current[i];
      if (g) g.rotation.x = a.bend * (0.4 + (i / (SEGMENTS - 1)) * 0.9);
    }

    tipRef.current?.getWorldPosition(rig.tip);
  });

  return (
    <group ref={root}>
      <group ref={pivot}>
        <mesh position={[0, -0.12, 0]} material={mats.cork}>
          <cylinderGeometry args={[0.025, 0.027, 0.3, 12]} />
        </mesh>
        <mesh position={[0, -0.275, 0]} material={mats.grip}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
        </mesh>
        <mesh position={[0, 0.045, 0]} material={mats.gold}>
          <cylinderGeometry args={[0.019, 0.019, 0.02, 12]} />
        </mesh>
        <mesh position={[0, 0.02, -0.03]} material={mats.metal}>
          <boxGeometry args={[0.018, 0.1, 0.02]} />
        </mesh>
        <mesh position={[0, 0.02, -0.075]} rotation={[0, 0, Math.PI / 2]} material={mats.metal}>
          <cylinderGeometry args={[0.04, 0.04, 0.045, 18]} />
        </mesh>
        <mesh position={[0.035, 0.02, -0.075]} rotation={[0, 0, Math.PI / 2]} material={mats.grip}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
        </mesh>
        <group position={[0, 0.055, 0]}>
          <Segment index={0} refs={segs} tipRef={tipRef} material={mats.blank} />
        </group>
      </group>
    </group>
  );
}
