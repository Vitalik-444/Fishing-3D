import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { SPAWN, TERRAIN_SIZE, terrainHeight } from '../world/terrain';
import { smoothstep } from '../world/math';
import { fbm } from '../world/noise';
import { hash2 } from '../world/rng';

const SEG = 300;
const C = {
  sand: new THREE.Color('#cdbd91'),
  wet: new THREE.Color('#8c805f'),
  bed: new THREE.Color('#4d4a3a'),
  grassA: new THREE.Color('#6a863d'),
  grassB: new THREE.Color('#4f6f2e'),
  forest: new THREE.Color('#3a5528'),
  rock: new THREE.Color('#7f7b72'),
};

function buildTerrain(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const n = pos.count;
  const stride = SEG + 1;
  const cell = TERRAIN_SIZE / SEG;

  const heights = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const h = terrainHeight(pos.getX(i), pos.getZ(i));
    heights[i] = h;
    pos.setY(i, h);
  }

  const colors = new Float32Array(n * 3);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heights[i];
    const l = heights[Math.max(i - 1, 0)];
    const r = heights[Math.min(i + 1, n - 1)];
    const u = heights[Math.max(i - stride, 0)];
    const d = heights[Math.min(i + stride, n - 1)];
    const slope = Math.hypot((r - l) / (2 * cell), (d - u) / (2 * cell));

    const n1 = fbm(x * 0.05, z * 0.05, 3);
    const n2 = fbm(x * 0.4 + 9, z * 0.4, 2);

    if (h < 0.05) {
      col.copy(C.wet).lerp(C.bed, smoothstep(0, 2.5, -h));
    } else {
      const sandT = 1 - smoothstep(0.3, 0.95, h + (n1 - 0.44) * 0.9);
      col.copy(C.grassA).lerp(C.grassB, smoothstep(0.3, 0.7, n1));
      col.lerp(C.forest, smoothstep(6, 26, h) * 0.8);
      col.lerp(C.sand, sandT);
      col.lerp(C.rock, smoothstep(0.5, 0.95, slope));
    }
    col.multiplyScalar(0.92 + n2 * 0.16);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function buildDetailTexture(): THREE.DataTexture {
  const size = 128;
  const period = 16;
  const data = new Uint8Array(size * size * 4);
  const lattice = (i: number, j: number) => hash2(((i % period) + period) % period, ((j % period) + period) % period);
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = lattice(ix, iy), b = lattice(ix + 1, iy), c = lattice(ix, iy + 1), d = lattice(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const f = size / period;
      const v = 0.55 * noise(x / f, y / f) + 0.3 * noise((x / f) * 2, (y / f) * 2) + 0.15 * hash2(x, y);
      const g = Math.round(255 * (0.7 + 0.3 * v));
      const k = (y * size + x) * 4;
      data[k] = data[k + 1] = data[k + 2] = g;
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(90, 90);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function Terrain({ receiveShadow }: { receiveShadow: boolean }) {
  const geometry = useMemo(buildTerrain, []);
  const detail = useMemo(buildDetailTexture, []);
  useEffect(() => () => { geometry.dispose(); detail.dispose(); }, [geometry, detail]);

  return (
    <mesh geometry={geometry} receiveShadow={receiveShadow}>
      <meshStandardMaterial vertexColors map={detail} roughness={1} metalness={0} />
    </mesh>
  );
}

export { SPAWN };
