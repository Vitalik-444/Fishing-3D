import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SPAWN, terrainHeight } from '../world/terrain';
import { fbm } from '../world/noise';
import { mulberry32 } from '../world/rng';
import type { QualityPreset } from '../qualityConfig';
import {
  makeBladeCluster, makeBroadleaf, makeBush, makePine, makeRock, makeSwayMaterial, windUniform,
} from './procedural';

interface Placement { x: number; y: number; z: number; s: number; r: number; tint: number; sy?: number }
type Accept = (x: number, z: number, h: number, rng: () => number) => number | null;
interface Range { x0: number; x1: number; z0: number; z1: number }

const nearSpawn = (x: number, z: number, r: number) => Math.hypot(x - SPAWN.x, z - SPAWN.z) < r;

/** Deterministic scatter: samples random points and keeps the ones `accept` gives a scale for. */
function scatter(count: number, seed: number, range: Range, accept: Accept): Placement[] {
  const rng = mulberry32(seed);
  const out: Placement[] = [];
  const maxAttempts = count * 60;
  for (let a = 0; a < maxAttempts && out.length < count; a++) {
    const x = range.x0 + rng() * (range.x1 - range.x0);
    const z = range.z0 + rng() * (range.z1 - range.z0);
    const h = terrainHeight(x, z);
    const s = accept(x, z, h, rng);
    if (s !== null) out.push({ x, y: h, z, s, r: rng() * Math.PI * 2, tint: rng() });
  }
  return out;
}

function InstancedField({
  geometry, material, placements, castShadow = false, receiveShadow = false,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  placements: Placement[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    placements.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.r, 0);
      dummy.scale.set(p.s, p.s * (p.sy ?? 1), p.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.9 + p.tint * 0.2, 0.92 + (1 - p.tint) * 0.14, 0.88 + p.tint * 0.12);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  if (placements.length === 0) return null;
  return (
    <instancedMesh
      key={placements.length}
      ref={ref}
      args={[geometry, material, placements.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

export function Vegetation({ quality }: { quality: QualityPreset }) {
  const assets = useMemo(() => {
    const solid = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
    return {
      pine: makePine(),
      broadleaf: makeBroadleaf(),
      bush: makeBush(),
      rock: makeRock(),
      grass: makeBladeCluster({ blades: 5, minH: 0.22, maxH: 0.5, width: 0.05, spread: 0.35, lean: 0.25, base: '#34501f', tip: '#97b450', seed: 7 }),
      reed: makeBladeCluster({ blades: 9, minH: 1.1, maxH: 1.9, width: 0.06, spread: 0.5, lean: 0.16, base: '#3f5a27', tip: '#aaa864', seed: 9 }),
      solid,
      grassMat: makeSwayMaterial(0.07),
      reedMat: makeSwayMaterial(0.09),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(assets).forEach((a) => a.dispose());
    },
    [assets],
  );

  useFrame((state) => {
    windUniform.value = state.clock.elapsedTime;
  });

  const placements = useMemo(() => {
    const forestMask = (x: number, z: number) => fbm(x * 0.03 + 5, z * 0.03, 3);
    const treeAccept: Accept = (x, z, h, rng) => {
      if (h < 1.1 || nearSpawn(x, z, 9)) return null;
      if (Math.abs(x) < 26 && z < SPAWN.z + 4) return null; // keep the view of the lake open
      if (forestMask(x, z) < 0.4 && rng() < 0.75) return null; // cluster into groves
      return 0.8 + rng() * 0.9;
    };
    const trees = scatter(quality.trees, 101, { x0: -165, x1: 165, z0: -150, z1: 70 }, treeAccept);
    const pines: Placement[] = [];
    const broad: Placement[] = [];
    trees.forEach((t, i) => {
      t.y -= 0.15;
      (t.y > 8 || i % 2 === 0 ? pines : broad).push(t);
    });

    return {
      pines,
      broad,
      bushes: scatter(quality.bushes, 202, { x0: -110, x1: 110, z0: -30, z1: 45 }, (x, z, h, rng) =>
        h > 0.55 && h < 8 && !nearSpawn(x, z, 5) && fbm(x * 0.05, z * 0.05, 2) > 0.38 ? 0.6 + rng() * 0.9 : null,
      ),
      rocks: scatter(quality.rocks, 303, { x0: -100, x1: 100, z0: -25, z1: 25 }, (x, z, h, rng) =>
        h > -0.8 && h < 2.2 && !nearSpawn(x, z, 3) ? 0.25 + rng() * rng() * 1.1 : null,
      ),
      reeds: scatter(quality.reeds, 404, { x0: -90, x1: 90, z0: -30, z1: 15 }, (x, z, h, rng) =>
        h > -0.55 && h < 0.22 && !nearSpawn(x, z, 5) ? 0.8 + rng() * 0.6 : null,
      ),
      grass: scatter(quality.grass, 505, { x0: SPAWN.x - 55, x1: SPAWN.x + 55, z0: SPAWN.z - 55, z1: SPAWN.z + 55 }, (x, z, h, rng) =>
        h > 0.45 && rng() < 0.4 + Math.min(0.55, (h - 0.45) * 0.6) ? 0.8 + rng() * 0.8 : null,
      ),
    };
  }, [quality]);

  const shade = quality.shadows;
  return (
    <>
      <InstancedField geometry={assets.pine} material={assets.solid} placements={placements.pines} castShadow={shade} />
      <InstancedField geometry={assets.broadleaf} material={assets.solid} placements={placements.broad} castShadow={shade} />
      <InstancedField geometry={assets.bush} material={assets.solid} placements={placements.bushes} castShadow={shade} receiveShadow={shade} />
      <InstancedField geometry={assets.rock} material={assets.solid} placements={placements.rocks} castShadow={shade} receiveShadow={shade} />
      <InstancedField geometry={assets.reed} material={assets.reedMat} placements={placements.reeds} />
      <InstancedField geometry={assets.grass} material={assets.grassMat} placements={placements.grass} />
    </>
  );
}
