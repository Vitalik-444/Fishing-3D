import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { SPECIES_BY_ID } from '../data/fishSpecies';
import { runtime } from '../fishing/fishingRuntime';
import { clamp } from '../world/math';
import { waveHeight } from '../world/waves';
import { bobber } from './playerState';

export function FishShadow() {
  const mesh = useRef<THREE.Mesh>(null);
  const angle = useRef(0);

  const assets = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.5, 0);
    shape.bezierCurveTo(0.35, 0.16, -0.1, 0.18, -0.38, 0.03);
    shape.lineTo(-0.5, 0.14);
    shape.lineTo(-0.5, -0.14);
    shape.lineTo(-0.38, -0.03);
    shape.bezierCurveTo(-0.1, -0.18, 0.35, -0.16, 0.5, 0);
    const geo = new THREE.ShapeGeometry(shape, 12);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: '#0b1a1c', transparent: true, opacity: 0, depthWrite: false });
    return { geo, mat };
  }, []);

  useEffect(
    () => () => {
      assets.geo.dispose();
      assets.mat.dispose();
    },
    [assets],
  );

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const gs = useGameStore.getState();
    const st = gs.fishingState;
    const nibbling = st === 'waiting' && runtime.waitPhase === 'nibbling';
    const active = nibbling || st === 'bite' || st === 'hooking' || st === 'fighting';
    const fish = runtime.fish ?? null;
    const target = active ? 0.34 : 0;
    const k = 1 - Math.exp(-delta * 6);
    assets.mat.opacity += (target - assets.mat.opacity) * k;
    m.visible = assets.mat.opacity > 0.01;
    if (!m.visible) return;

    const dt = gs.phase === 'playing' ? Math.min(delta, 0.05) : 0;
    const t = state.clock.elapsedTime;
    const species = fish ? SPECIES_BY_ID[fish.speciesId] : null;
    const length = fish ? clamp(fish.length / 100, 0.25, 1.2) : 0.35;
    m.scale.setScalar(length * 1.1);

    let x = bobber.position.x;
    let z = bobber.position.z;
    let heading = 0;
    if (st === 'fighting') {
      const pull = runtime.fightPhase === 'pull';
      angle.current += dt * (pull ? 3.2 : 1.2);
      const r = 0.7 + (pull ? 0.5 : 0.2);
      x += Math.cos(angle.current) * r + runtime.fightDirX * 0.8;
      z += Math.sin(angle.current) * r + runtime.fightDirZ * 0.8;
      heading = -(angle.current + Math.PI / 2);
    } else {
      angle.current += dt * (nibbling ? 1.6 : 0.4);
      const r = st === 'bite' || st === 'hooking' ? 0.15 : 0.55 + Math.sin(t * 1.3) * 0.12;
      x += Math.cos(angle.current) * r;
      z += Math.sin(angle.current) * r;
      heading = -(angle.current + Math.PI / 2);
    }
    m.position.set(x, waveHeight(x, z, t) + 0.018, z);
    m.rotation.y = heading;
    void species;
  });

  return <mesh ref={mesh} geometry={assets.geo} material={assets.mat} renderOrder={1} visible={false} />;
}
