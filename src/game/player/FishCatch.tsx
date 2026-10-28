import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { SPECIES_BY_ID } from '../data/fishSpecies';
import { runtime } from '../fishing/fishingRuntime';
import { spawnRipple, spawnSplash } from '../effects';
import { clamp } from '../world/math';
import { player } from './playerState';

const FLIGHT = 0.85;
const start = new THREE.Vector3();
const end = new THREE.Vector3();
const offset = new THREE.Vector3();

export function FishCatch() {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const shownId = useRef<string | null>(null);
  const age = useRef(0);
  const splashed = useRef(false);

  const assets = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({ color: '#8fa3ab', roughness: 0.45, metalness: 0.15 });
    const belly = new THREE.MeshStandardMaterial({ color: '#e8ece9', roughness: 0.5 });
    const fin = new THREE.MeshStandardMaterial({ color: '#d6502f', roughness: 0.6, side: THREE.DoubleSide });
    const eye = new THREE.MeshBasicMaterial({ color: '#101614' });
    const bodyGeo = new THREE.SphereGeometry(0.5, 20, 14);
    const tailGeo = new THREE.ConeGeometry(0.17, 0.3, 4);
    tailGeo.rotateZ(Math.PI / 2);
    const finGeo = new THREE.ConeGeometry(0.09, 0.22, 3);
    const eyeGeo = new THREE.SphereGeometry(0.024, 8, 6);
    return { body, belly, fin, eye, bodyGeo, tailGeo, finGeo, eyeGeo };
  }, []);

  useEffect(() => () => Object.values(assets).forEach((a) => a.dispose()), [assets]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const gs = useGameStore.getState();
    const pending = gs.pendingCatch;
    if (!pending || gs.fishingState !== 'caught') {
      g.visible = false;
      shownId.current = null;
      return;
    }

    const fish = pending.fish;
    const species = SPECIES_BY_ID[fish.speciesId];
    if (shownId.current !== fish.id) {
      shownId.current = fish.id;
      age.current = 0;
      splashed.current = false;
      assets.body.color.set(species.visual.body);
      assets.belly.color.set(species.visual.belly);
      assets.fin.color.set(species.visual.fin);
      const len = clamp(fish.length / 100, 0.28, 0.85);
      const ratio = clamp(species.visual.bodyRatio, 0.7, 1.6);
      g.scale.set(len, len * (0.55 + ratio * 0.45), len * 0.75);
    }

    const dt = gs.phase === 'playing' ? Math.min(delta, 0.05) : 0;
    age.current += dt;
    const t = state.clock.elapsedTime;
    const e = clamp(age.current / FLIGHT, 0, 1);
    const eased = 1 - (1 - e) * (1 - e);

    start.set(
      player.position.x + runtime.fightDirX * 1.8,
      0.05,
      player.position.z + runtime.fightDirZ * 1.8,
    );
    end.set(-0.22, -0.36, -1.05).applyQuaternion(camera.quaternion).add(camera.position);
    g.position.lerpVectors(start, end, eased);
    g.position.y += Math.sin(Math.PI * eased) * 0.8;
    g.rotation.set(0, player.yaw, Math.sin(t * 22) * 0.35 * (1 - eased) + Math.sin(t * 2.2) * 0.04 * eased);
    g.visible = true;

    if (tail.current) tail.current.rotation.y = Math.sin(t * (e < 1 ? 26 : 5)) * (e < 1 ? 0.5 : 0.18);

    if (!splashed.current && e > 0.02) {
      splashed.current = true;
      spawnSplash(start.x, 0, start.z, 0.9);
      spawnRipple(start.x, start.z, 1.6, 1.2);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={assets.bodyGeo} material={assets.body} />
      <mesh geometry={assets.bodyGeo} material={assets.belly} position={[0.02, -0.07, 0]} scale={[0.96, 0.62, 0.9]} />
      <mesh ref={tail} geometry={assets.tailGeo} material={assets.fin} position={[-0.58, 0, 0]} />
      <mesh geometry={assets.finGeo} material={assets.fin} position={[0.0, 0.2, 0]} />
      <mesh geometry={assets.eyeGeo} material={assets.eye} position={[0.38, 0.06, 0.15]} />
      <mesh geometry={assets.eyeGeo} material={assets.eye} position={[0.38, 0.06, -0.15]} />
    </group>
  );
}
