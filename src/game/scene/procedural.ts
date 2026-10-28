import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hash2, mulberry32 } from '../world/rng';
import { lerp } from '../world/math';

function posNoise(x: number, y: number, z: number, seed: number): number {
  return hash2(Math.round(x * 50) + seed * 17 + Math.round(y * 50) * 131, Math.round(z * 50) + Math.round(y * 50) * 7) * 2 - 1;
}

export function paintGradient(g: THREE.BufferGeometry, bottom: string, top: string, variation = 0, seed = 0): void {
  const pos = g.attributes.position;
  g.computeBoundingBox();
  const { min, max } = g.boundingBox!;
  const span = Math.max(max.y - min.y, 1e-4);
  const a = new THREE.Color(bottom);
  const b = new THREE.Color(top);
  const c = new THREE.Color();
  const arr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    c.copy(a).lerp(b, (y - min.y) / span);
    const v = 1 + posNoise(x, y, z, seed) * variation;
    arr[i * 3] = c.r * v;
    arr[i * 3 + 1] = c.g * v;
    arr[i * 3 + 2] = c.b * v;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
}

export function jitter(g: THREE.BufferGeometry, amount: number, seed = 0): void {
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    pos.setXYZ(
      i,
      x + posNoise(x, y, z, seed) * amount,
      y + posNoise(x, y, z, seed + 1) * amount,
      z + posNoise(x, y, z, seed + 2) * amount,
    );
  }
  pos.needsUpdate = true;
}

function ensureUV(g: THREE.BufferGeometry): void {
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
}

export function smoothBlob(radius: number, detail: number, amount: number, seed: number): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(radius, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  jitter(g, amount * radius, seed);
  g.computeVertexNormals();
  ensureUV(g);
  return g;
}

export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const list = parts.map((p) => {
    ensureUV(p);
    return p.index ? p.toNonIndexed() : p;
  });
  const merged = mergeGeometries(list, false);
  if (!merged) throw new Error('Could not merge procedural geometry');
  parts.forEach((p) => p.dispose());
  return merged;
}

export function makePine(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.1, 0.2, 2.2, 6, 1);
  trunk.translate(0, 1.1, 0);
  paintGradient(trunk, '#3d2b1d', '#5a4331', 0.06, 1);
  parts.push(trunk);
  const layers = [
    { y: 1.7, r: 1.6, h: 2.5 },
    { y: 3.3, r: 1.28, h: 2.3 },
    { y: 4.7, r: 0.95, h: 2.1 },
    { y: 5.9, r: 0.6, h: 1.8 },
  ];
  layers.forEach((l, i) => {
    const cone = new THREE.ConeGeometry(l.r, l.h, 9, 1);
    cone.translate(0, l.y + l.h / 2, 0);
    paintGradient(cone, '#233f25', '#4d7b3b', 0.08, 10 + i);
    jitter(cone, 0.07, 20 + i);
    parts.push(cone);
  });
  return mergeParts(parts);
}

export function makeBroadleaf(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.14, 0.26, 2.9, 7, 1);
  trunk.translate(0, 1.45, 0);
  paintGradient(trunk, '#46352a', '#6a5340', 0.08, 2);
  parts.push(trunk);
  const blobs: [number, number, number, number][] = [
    [0, 3.7, 0, 1.6],
    [0.95, 3.2, 0.3, 1.2],
    [-0.85, 3.3, -0.4, 1.3],
    [0.2, 4.55, -0.2, 1.1],
    [-0.3, 3.1, 0.95, 1.1],
  ];
  blobs.forEach(([x, y, z, r], i) => {
    const b = smoothBlob(r, 1, 0.17, 30 + i);
    b.translate(x, y, z);
    paintGradient(b, '#3b6a2f', '#7aa94d', 0.1, 40 + i);
    parts.push(b);
  });
  return mergeParts(parts);
}

export function makeBush(): THREE.BufferGeometry {
  const b = smoothBlob(0.8, 1, 0.18, 50);
  b.scale(1, 0.7, 1);
  b.translate(0, 0.45, 0);
  paintGradient(b, '#355c2a', '#6c9c43', 0.1, 51);
  return b;
}

export function makeRock(): THREE.BufferGeometry {
  const r = smoothBlob(1, 1, 0.24, 60);
  r.scale(1.25, 0.8, 1);
  paintGradient(r, '#66635d', '#a29e95', 0.14, 61);
  return r;
}

interface BladeOptions {
  blades: number; minH: number; maxH: number; width: number;
  spread: number; lean: number; base: string; tip: string; seed: number;
}

export function makeBladeCluster(o: BladeOptions): THREE.BufferGeometry {
  const rng = mulberry32(o.seed);
  const pos: number[] = [];
  const col: number[] = [];
  const nor: number[] = [];
  const cb = new THREE.Color(o.base);
  const ct = new THREE.Color(o.tip);

  for (let b = 0; b < o.blades; b++) {
    const ang = rng() * Math.PI * 2;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const ox = (rng() - 0.5) * o.spread, oz = (rng() - 0.5) * o.spread;
    const h = lerp(o.minH, o.maxH, rng());
    const w = o.width * (0.8 + rng() * 0.4);
    const leanDist = (0.4 + rng() * 0.6) * o.lean * h;
    const la = rng() * Math.PI * 2;
    const pts: [number, number, number][] = [
      [-w / 2, 0, 0],
      [w / 2, 0, 0],
      [Math.cos(la) * leanDist, h, Math.sin(la) * leanDist],
    ];
    const world = pts.map(([x, y, z]) => [x * ca + z * sa + ox, y, -x * sa + z * ca + oz] as const);
    const colors = [cb, cb, ct];
    for (const order of [[0, 1, 2], [0, 2, 1]]) {
      for (const k of order) {
        pos.push(world[k][0], world[k][1], world[k][2]);
        col.push(colors[k].r, colors[k].g, colors[k].b);
        nor.push(0, 1, 0);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

export const windUniform = { value: 0 };

export function makeSwayMaterial(amplitude: number): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = windUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float sway = sin(uWind * 1.7 + instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.7 + position.y * 1.3) * ${amplitude.toFixed(3)} * position.y;
          transformed.x += sway;
          transformed.z += sway * 0.6;
        #endif`,
      );
  };
  m.customProgramCacheKey = () => `sway-${amplitude}`;
  return m;
}
