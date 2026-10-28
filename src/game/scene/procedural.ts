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

function limb(from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, c0: string, c1: string, seed: number): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, 6, 2);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate(from.x, from.y, from.z);
  g.deleteAttribute('uv');
  paintGradient(g, c0, c1, 0.08, seed);
  return g;
}

/** Cone layer with a scalloped, drooping skirt, so pine branches don't look like a stack of party hats. */
function pineSkirt(radius: number, height: number, seg: number, seed: number, droop: number, bottom: string, top: string): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.ConeGeometry(radius, height, seg, 3, false);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const yn = (y + height / 2) / height; // 0 at base, 1 at tip
    const rn = Math.hypot(x, z) / radius;
    if (rn < 1e-4) continue;
    const ang = Math.atan2(z, x);
    const lobe = 1 + (0.16 * Math.sin(ang * 5 + seed) + 0.1 * Math.sin(ang * 9 + seed * 2.3)) * (1 - yn) * (1 - yn * 0.4);
    const sag = droop * rn * rn * (1 - yn * 0.3);
    pos.setXYZ(i, x * lobe, y - sag + (lobe - 1) * 0.35, z * lobe);
  }
  pos.needsUpdate = true;
  g.rotateY(seed * 1.7);
  paintGradient(g, bottom, top, 0.1, 100 + Math.round(seed * 10));
  jitter(g, 0.035, 200 + Math.round(seed * 10));
  g.computeVertexNormals();
  ensureUV(g);
  return g;
}

export function makePine(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.07, 0.22, 7.2, 7, 5);
  trunk.translate(0, 3.6, 0);
  const tp = trunk.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i);
    const flare = 1 + Math.max(0, 0.7 - y) * 0.9;
    tp.setXYZ(i, tp.getX(i) * flare, y, tp.getZ(i) * flare);
  }
  tp.needsUpdate = true;
  trunk.deleteAttribute('uv');
  paintGradient(trunk, '#2f2117', '#5a4331', 0.1, 1);
  parts.push(trunk);

  const layers = 8;
  for (let i = 0; i < layers; i++) {
    const k = i / (layers - 1);
    const r = 2.05 * (1 - k * 0.86);
    const h = 2.1 - k * 0.7;
    const y = 1.1 + k * 5.4;
    const dark = new THREE.Color('#183a22').lerp(new THREE.Color('#2a5230'), k);
    const light = new THREE.Color('#3d6e3a').lerp(new THREE.Color('#6a9a4c'), k);
    const layer = pineSkirt(r, h, 12, i + 1, 0.22 * (1 - k * 0.5), `#${dark.getHexString()}`, `#${light.getHexString()}`);
    layer.translate(0, y + h / 2, 0);
    parts.push(layer);
  }
  const tip = new THREE.ConeGeometry(0.16, 0.9, 6, 1);
  tip.translate(0, 7.1, 0);
  tip.deleteAttribute('uv');
  paintGradient(tip, '#3d6e3a', '#7aa85a', 0.05, 7);
  parts.push(tip);
  return mergeParts(parts);
}

const LEAF_PALETTES: [string, string][] = [
  ['#2f5a28', '#5d9440'],
  ['#3b6a2f', '#7aa94d'],
  ['#436f2c', '#8dba55'],
  ['#35602a', '#6aa045'],
];

function canopy(parts: THREE.BufferGeometry[], cx: number, cy: number, cz: number, spread: number, count: number, size: number, seed: number, palettes = LEAF_PALETTES): void {
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const u = rng();
    const r = spread * Math.sqrt(u);
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    const y = cy + (rng() - 0.35) * spread * 0.85 * (1 - u * 0.4);
    const blob = smoothBlob(size * (0.65 + rng() * 0.6), 1, 0.24, seed + i);
    blob.scale(1, 0.82 + rng() * 0.2, 1);
    blob.translate(x, y, z);
    const pal = palettes[Math.floor(rng() * palettes.length)];
    paintGradient(blob, pal[0], pal[1], 0.13, seed + 50 + i);
    parts.push(blob);
  }
}

export function makeBroadleaf(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.13, 0.3, 2.8, 8, 4);
  trunk.translate(0, 1.4, 0);
  const tp = trunk.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i);
    const flare = 1 + Math.max(0, 0.55 - y) * 1.0;
    tp.setXYZ(i, tp.getX(i) * flare + Math.sin(y * 1.7) * 0.05, y, tp.getZ(i) * flare);
  }
  tp.needsUpdate = true;
  trunk.deleteAttribute('uv');
  paintGradient(trunk, '#2f241a', '#6a5340', 0.1, 2);
  parts.push(trunk);

  const top = new THREE.Vector3(0, 2.7, 0);
  const ends: [number, number, number][] = [[1.0, 3.7, 0.35], [-0.9, 3.5, -0.4], [0.1, 4.2, -0.9], [-0.25, 3.4, 1.0]];
  ends.forEach(([x, y, z], i) => parts.push(limb(top, new THREE.Vector3(x, y, z), 0.1, 0.045, '#4a3a2c', '#5a4636', 70 + i)));

  canopy(parts, 0, 4.05, 0, 1.45, 12, 1.12, 300);
  return mergeParts(parts);
}

export function makeBirch(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.07, 0.15, 4.2, 7, 8);
  trunk.translate(0, 2.1, 0);
  const tp = trunk.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i);
    tp.setXYZ(i, tp.getX(i) + Math.sin(y * 1.3) * 0.07, y, tp.getZ(i) + Math.cos(y * 1.1) * 0.05);
  }
  tp.needsUpdate = true;
  trunk.deleteAttribute('uv');
  paintGradient(trunk, '#9a9486', '#e8e4d8', 0.1, 3);
  // dark bark bands
  const col = trunk.attributes.color as THREE.BufferAttribute;
  for (let i = 0; i < col.count; i++) {
    const y = tp.getY(i);
    const band = Math.sin(y * 9 + tp.getX(i) * 40) * Math.sin(y * 4.3 + tp.getZ(i) * 30);
    const k = band > 0.55 ? 0.38 : 1;
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  col.needsUpdate = true;
  parts.push(trunk);
  const base = new THREE.Vector3(0.05, 3.0, 0);
  parts.push(limb(base, new THREE.Vector3(0.8, 4.2, 0.2), 0.05, 0.025, '#d8d3c4', '#c4bfae', 80));
  parts.push(limb(base, new THREE.Vector3(-0.7, 4.0, -0.3), 0.05, 0.025, '#d8d3c4', '#c4bfae', 81));
  canopy(parts, 0, 4.7, 0, 1.1, 10, 0.85, 500, [
    ['#5a8a34', '#a7c862'],
    ['#6a9a3a', '#b7d46d'],
    ['#4f7f30', '#98bd58'],
  ]);
  return mergeParts(parts);
}

export function makeBush(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  canopy(parts, 0, 0.5, 0, 0.5, 5, 0.55, 600, [
    ['#2f5426', '#5f9040'],
    ['#365f2a', '#6c9c43'],
  ]);
  return mergeParts(parts);
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
    const lx = Math.cos(la), lz = Math.sin(la);
    const pts: [number, number, number][] = [
      [-w / 2, 0, 0],
      [w / 2, 0, 0],
      [-w * 0.32 + lx * leanDist * 0.25, h * 0.55, lz * leanDist * 0.25],
      [w * 0.32 + lx * leanDist * 0.25, h * 0.55, lz * leanDist * 0.25],
      [lx * leanDist, h, lz * leanDist],
    ];
    const world = pts.map(([x, y, z]) => [x * ca + z * sa + ox, y, -x * sa + z * ca + oz] as const);
    const cm = cb.clone().lerp(ct, 0.5);
    const colors = [cb, cb, cm, cm, ct];
    const tris = [[0, 1, 3], [0, 3, 2], [2, 3, 4]];
    for (const tri of tris) {
      for (const order of [[0, 1, 2], [0, 2, 1]]) {
        for (const k of order) {
          const i = tri[k];
          pos.push(world[i][0], world[i][1], world[i][2]);
          col.push(colors[i].r, colors[i].g, colors[i].b);
          nor.push(0, 1, 0);
        }
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

export function makeSwayMaterial(amplitude: number, power = 1): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = windUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float wx = instanceMatrix[3].x;
          float wz = instanceMatrix[3].z;
          float gust = 0.55 + 0.45 * sin(uWind * 0.7 + wx * 0.11 + wz * 0.08);
          float hh = pow(max(position.y, 0.0), ${power.toFixed(2)});
          float sway = (sin(uWind * 1.7 + wx * 0.9 + wz * 0.7 + position.y * 1.3) + 0.35 * sin(uWind * 3.1 + wx * 1.7 + wz * 1.3)) * ${amplitude.toFixed(4)} * hh * gust;
          transformed.x += sway;
          transformed.z += sway * 0.6;
        #endif`,
      );
  };
  m.customProgramCacheKey = () => `sway-${amplitude}-${power}`;
  return m;
}

export function makeFlower(petal: string, center: string, seed: number): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const pos: number[] = [];
  const col: number[] = [];
  const nor: number[] = [];
  const stem = new THREE.Color('#44652a');
  const stemTip = new THREE.Color('#5d8a35');
  const pc = new THREE.Color(petal);
  const cc = new THREE.Color(center);
  const tri = (pts: [number, number, number][], cols: THREE.Color[]) => {
    for (const order of [[0, 1, 2], [0, 2, 1]]) {
      for (const k of order) {
        pos.push(pts[k][0], pts[k][1], pts[k][2]);
        col.push(cols[k].r, cols[k].g, cols[k].b);
        nor.push(0, 1, 0);
      }
    }
  };
  for (let f = 0; f < 3; f++) {
    const ox = (rng() - 0.5) * 0.34;
    const oz = (rng() - 0.5) * 0.34;
    const h = 0.2 + rng() * 0.17;
    const hx = ox + (rng() - 0.5) * 0.08;
    const hz = oz + (rng() - 0.5) * 0.08;
    const w = 0.011;
    tri([[ox - w, 0, oz], [ox + w, 0, oz], [hx, h, hz]], [stem, stem, stemTip]);
    const R = 0.05 + rng() * 0.02;
    const petals = 6;
    for (let k = 0; k < petals; k++) {
      const am = (k / petals) * Math.PI * 2 + rng() * 0.2;
      const side = (d: number, rad: number, lift: number): [number, number, number] => [hx + Math.cos(am + d) * rad, h + lift, hz + Math.sin(am + d) * rad];
      const c: [number, number, number] = [hx, h + 0.012, hz];
      const s0 = side(-0.4, R * 0.62, 0.014);
      const tp = side(0, R, 0.006);
      const s1 = side(0.4, R * 0.62, 0.014);
      tri([c, s0, tp], [cc, pc, pc]);
      tri([c, tp, s1], [cc, pc, pc]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
