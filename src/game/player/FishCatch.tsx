import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { FISH_SPECIES, SPECIES_BY_ID } from '../data/fishSpecies';
import { runtime } from '../fishing/fishingRuntime';
import { spawnRipple, spawnSplash } from '../effects';
import { clamp } from '../world/math';
import { fishWave, getFishModel, warmFishModels } from '../fish/fishModel';
import { player } from './playerState';

const FLIGHT = 0.85;
const start = new THREE.Vector3();
const end = new THREE.Vector3();

export function FishCatch() {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const shownId = useRef<string | null>(null);
  const age = useRef(0);
  const splashed = useRef(false);
  const [speciesId, setSpeciesId] = useState<string>(FISH_SPECIES[0].id);

  const model = useMemo(() => getFishModel(speciesId), [speciesId]);

  // build every species model in the background so the first catch doesn't hitch
  useEffect(() => warmFishModels(FISH_SPECIES.map((s) => s.id)), []);

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
    if (species && species.id !== speciesId) {
      // wait one frame for the right model to mount, so the wrong species never flashes
      setSpeciesId(species.id);
      g.visible = false;
      return;
    }
    if (shownId.current !== fish.id) {
      shownId.current = fish.id;
      age.current = 0;
      splashed.current = false;
      const len = clamp(fish.length / 100, 0.3, 0.9);
      g.scale.setScalar(len);
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
    g.rotation.set(
      Math.sin(t * 17) * 0.25 * (1 - eased),
      player.yaw,
      Math.sin(t * 22) * 0.35 * (1 - eased) + Math.sin(t * 2.2) * 0.04 * eased,
    );
    g.visible = true;

    // body wave: frantic in the air, slow gasping once in hand
    fishWave.uTime.value = t;
    fishWave.uAmp.value = e < 1 ? 0.16 : 0.05;
    fishWave.uSpeed.value = e < 1 ? 26 : 6;

    if (!splashed.current && e > 0.02) {
      splashed.current = true;
      spawnSplash(start.x, 0, start.z, 0.9);
      spawnRipple(start.x, start.z, 1.6, 1.2);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={model.body} material={model.bodyMaterial} castShadow />
      <mesh geometry={model.fins} material={model.finMaterial} />
      <mesh geometry={model.extras} material={model.extraMaterial} />
    </group>
  );
}
