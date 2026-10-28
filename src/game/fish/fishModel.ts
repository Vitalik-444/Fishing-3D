import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SPECIES_BY_ID, type FishSpecies } from '../data/fishSpecies';
import { mulberry32 } from '../world/rng';

/**
 * Procedural fish. Model space: length 1, head at +X, tail at -X, back at +Y, flanks at ±Z.
 * t = 0 is the tail, t = 1 is the nose (x = t - 0.5).
 */

interface FinSpan {
  t0: number;
  t1: number;
  h: number;
  /** >1 pushes the tallest part towards the head, <1 towards the tail */
  skew: number;
}

interface FishShape {
  height: number;
  width: number;
  maxPos: number;
  peduncle: number;
  snout: number;
  topK: number;
  botK: number;
  headFlat: number;
  headWiden: number;
  silver: number;
  scales: number;
  tailLen: number;
  tailH?: number;
  tailRound?: boolean;
  tailLower?: number;
  dorsals: FinSpan[];
  anals: FinSpan[];
  pectoral: { t: number; len: number };
  pelvic: { t: number; len: number };
  eyeR: number;
  eyeT: number;
  eyeTheta: number;
  iris: string;
  barbels?: 'carp' | 'cat';
  mottled?: boolean;
  spiky?: boolean;
}

const SHAPES: Record<string, FishShape> = {
  common_roach: {
    height: 0.27, width: 0.1, maxPos: 0.56, peduncle: 0.24, snout: 2.0, topK: 0.9, botK: 1, headFlat: 1, headWiden: 0,
    silver: 0.85, scales: 15, tailLen: 0.19, tailLower: 0.1,
    dorsals: [{ t0: 0.4, t1: 0.58, h: 0.12, skew: 1.2 }], anals: [{ t0: 0.26, t1: 0.45, h: 0.09, skew: 0.9 }],
    pectoral: { t: 0.72, len: 0.1 }, pelvic: { t: 0.56, len: 0.09 },
    eyeR: 0.022, eyeT: 0.87, eyeTheta: 1.35, iris: '#e8542a',
  },
  crucian_carp: {
    height: 0.4, width: 0.15, maxPos: 0.52, peduncle: 0.3, snout: 2.2, topK: 0.95, botK: 0.9, headFlat: 1, headWiden: 0,
    silver: 0.15, scales: 22, tailLen: 0.17,
    dorsals: [{ t0: 0.2, t1: 0.72, h: 0.1, skew: 1.0 }], anals: [{ t0: 0.26, t1: 0.42, h: 0.08, skew: 1 }],
    pectoral: { t: 0.7, len: 0.1 }, pelvic: { t: 0.54, len: 0.09 },
    eyeR: 0.02, eyeT: 0.88, eyeTheta: 1.35, iris: '#c9a14a',
  },
  european_perch: {
    height: 0.29, width: 0.12, maxPos: 0.55, peduncle: 0.2, snout: 1.9, topK: 1.1, botK: 0.85, headFlat: 1, headWiden: 0,
    silver: 0.2, scales: 11, tailLen: 0.15, spiky: true,
    dorsals: [{ t0: 0.4, t1: 0.72, h: 0.13, skew: 0.8 }, { t0: 0.18, t1: 0.34, h: 0.09, skew: 1 }],
    anals: [{ t0: 0.26, t1: 0.38, h: 0.08, skew: 1 }],
    pectoral: { t: 0.72, len: 0.1 }, pelvic: { t: 0.58, len: 0.09 },
    eyeR: 0.026, eyeT: 0.87, eyeTheta: 1.3, iris: '#e7c43a',
  },
  common_bream: {
    height: 0.46, width: 0.11, maxPos: 0.55, peduncle: 0.2, snout: 2.1, topK: 1.0, botK: 0.9, headFlat: 1, headWiden: 0,
    silver: 0.65, scales: 17, tailLen: 0.2, tailLower: 0.18,
    dorsals: [{ t0: 0.4, t1: 0.56, h: 0.15, skew: 1.3 }], anals: [{ t0: 0.18, t1: 0.58, h: 0.1, skew: 0.7 }],
    pectoral: { t: 0.7, len: 0.12 }, pelvic: { t: 0.54, len: 0.1 },
    eyeR: 0.02, eyeT: 0.88, eyeTheta: 1.35, iris: '#d8d4b4',
  },
  common_carp: {
    height: 0.34, width: 0.17, maxPos: 0.55, peduncle: 0.3, snout: 2.2, topK: 0.95, botK: 0.95, headFlat: 1, headWiden: 0,
    silver: 0.1, scales: 24, tailLen: 0.18,
    dorsals: [{ t0: 0.22, t1: 0.7, h: 0.12, skew: 1.1 }], anals: [{ t0: 0.26, t1: 0.38, h: 0.08, skew: 1 }],
    pectoral: { t: 0.7, len: 0.11 }, pelvic: { t: 0.54, len: 0.1 },
    eyeR: 0.02, eyeT: 0.87, eyeTheta: 1.3, iris: '#b88a3a', barbels: 'carp',
  },
  grass_carp: {
    height: 0.24, width: 0.16, maxPos: 0.5, peduncle: 0.27, snout: 1.9, topK: 0.95, botK: 0.9, headFlat: 0.85, headWiden: 0.1,
    silver: 0.3, scales: 20, tailLen: 0.18,
    dorsals: [{ t0: 0.4, t1: 0.58, h: 0.13, skew: 1 }], anals: [{ t0: 0.28, t1: 0.42, h: 0.09, skew: 1 }],
    pectoral: { t: 0.7, len: 0.11 }, pelvic: { t: 0.52, len: 0.1 },
    eyeR: 0.02, eyeT: 0.87, eyeTheta: 1.3, iris: '#b49a50',
  },
  northern_pike: {
    height: 0.16, width: 0.13, maxPos: 0.42, peduncle: 0.18, snout: 1.5, topK: 1.0, botK: 0.85, headFlat: 0.55, headWiden: 0.35,
    silver: 0, scales: 9, tailLen: 0.17, tailH: 0.1,
    dorsals: [{ t0: 0.14, t1: 0.3, h: 0.1, skew: 1.2 }], anals: [{ t0: 0.14, t1: 0.28, h: 0.09, skew: 1.2 }],
    pectoral: { t: 0.72, len: 0.1 }, pelvic: { t: 0.5, len: 0.08 },
    eyeR: 0.02, eyeT: 0.86, eyeTheta: 1.1, iris: '#d6b13a',
  },
  european_catfish: {
    height: 0.17, width: 0.22, maxPos: 0.46, peduncle: 0.45, snout: 2.6, topK: 0.95, botK: 0.7, headFlat: 0.6, headWiden: 0.5,
    silver: 0, scales: 0, tailLen: 0.14, tailH: 0.1, tailRound: true, mottled: true,
    dorsals: [{ t0: 0.62, t1: 0.68, h: 0.05, skew: 1 }], anals: [{ t0: 0.08, t1: 0.62, h: 0.075, skew: 0.8 }],
    pectoral: { t: 0.72, len: 0.09 }, pelvic: { t: 0.42, len: 0.06 },
    eyeR: 0.012, eyeT: 0.9, eyeTheta: 0.95, iris: '#1a1a14', barbels: 'cat',
  },
};

const FALLBACK: FishShape = SHAPES.common_roach;

function shapeOf(species: FishSpecies): FishShape {
  return SHAPES[species.id] ?? FALLBACK;
}

/* ------------------------------------------------------------------ */
/* Swim wave shared by every fish material                              */
/* ------------------------------------------------------------------ */

export const fishWave = {
  uTime: { value: 0 },
  uAmp: { value: 0.05 },
  uSpeed: { value: 8 },
};

function patchWave<T extends THREE.Material>(m: T): T {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uFishTime = fishWave.uTime;
    shader.uniforms.uFishAmp = fishWave.uAmp;
    shader.uniforms.uFishSpeed = fishWave.uSpeed;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uFishTime;\nuniform float uFishAmp;\nuniform float uFishSpeed;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float fw = clamp((0.42 - position.x) / 0.92, 0.0, 1.0);
        transformed.z += sin(position.x * 7.0 - uFishTime * uFishSpeed) * uFishAmp * fw * fw;`,
      );
  };
  m.customProgramCacheKey = () => 'fish-wave';
  return m;
}

/* ------------------------------------------------------------------ */
/* Body surface                                                         */
/* ------------------------------------------------------------------ */

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function envelope(s: FishShape, t: number): number {
  const m = s.maxPos;
  if (t < m) {
    const k = t / m;
    const e = s.peduncle + (1 - s.peduncle) * Math.pow(Math.sin((k * Math.PI) / 2), 1.25);
    return e * (0.45 + 0.55 * smooth(0, 0.03, t));
  }
  const u = (t - m) / (1 - m);
  const p = s.snout;
  return Math.pow(Math.max(1 - Math.pow(u, p), 0), 1 / p);
}

interface Surface {
  x: number;
  hTop: number;
  hBot: number;
  w: number;
}

function surfaceAt(s: FishShape, t: number): Surface {
  const e = envelope(s, t);
  const hh = s.height / 2;
  const head = smooth(0.7, 0.97, t);
  // gill-cover groove just behind the head
  const groove = 1 - 0.035 * Math.exp(-Math.pow((t - 0.76) / 0.012, 2));
  const flat = lerp(1, s.headFlat, head);
  return {
    x: t - 0.5,
    hTop: e * hh * s.topK * flat * groove,
    hBot: e * hh * s.botK * lerp(1, Math.min(1, s.headFlat + 0.3), head) * groove,
    w: e * (s.width / 2) * (1 + s.headWiden * head) * groove,
  };
}

function bodyPoint(s: FishShape, t: number, theta: number, out: THREE.Vector3): THREE.Vector3 {
  const f = surfaceAt(s, t);
  const c = Math.cos(theta);
  out.set(f.x, c >= 0 ? c * f.hTop : c * f.hBot, Math.sin(theta) * f.w);
  return out;
}

function buildBody(s: FishShape): THREE.BufferGeometry {
  const L = 110;
  const R = 36;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= L; i++) {
    const t = i / L;
    for (let j = 0; j <= R; j++) {
      const v = j / R;
      bodyPoint(s, t, v * Math.PI * 2, p);
      pos.push(p.x, p.y, p.z);
      uv.push(t, 1 - v);
    }
  }
  const row = R + 1;
  for (let i = 0; i < L; i++) {
    for (let j = 0; j < R; j++) {
      const a = i * row + j;
      const b = (i + 1) * row + j;
      const c = i * row + j + 1;
      const d = (i + 1) * row + j + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  // remove the visible crease along the UV seam
  const n = g.attributes.normal as THREE.BufferAttribute;
  const tmp = new THREE.Vector3();
  for (let i = 0; i <= L; i++) {
    const a = i * row;
    const b = i * row + R;
    tmp.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, tmp.x, tmp.y, tmp.z);
    n.setXYZ(b, tmp.x, tmp.y, tmp.z);
  }
  // nose and tail caps point along the axis
  for (let j = 0; j <= R; j++) {
    n.setXYZ(L * row + j, 1, 0, 0);
    n.setXYZ(j, -1, 0, 0);
  }
  n.needsUpdate = true;
  return g;
}

/* ------------------------------------------------------------------ */
/* Fins                                                                 */
/* ------------------------------------------------------------------ */

class FinBuilder {
  pos: number[] = [];
  col: number[] = [];
  idx: number[] = [];

  /** Quad strip between a base curve and a tip curve, with a gradient and soft fin rays. */
  strip(base: THREE.Vector3[], tip: THREE.Vector3[], cBase: THREE.Color, cTip: THREE.Color, rows = 3, flip = false): void {
    const start = this.pos.length / 3;
    const K = base.length;
    const c = new THREE.Color();
    const q = new THREE.Vector3();
    for (let k = 0; k < K; k++) {
      const ray = k % 2 === 0 ? 1 : 0.8;
      for (let m = 0; m <= rows; m++) {
        const f = m / rows;
        q.lerpVectors(base[k], tip[k], f);
        this.pos.push(q.x, q.y, q.z);
        c.copy(cBase).lerp(cTip, Math.pow(f, 1.3)).multiplyScalar(lerp(1, ray, 0.5 + f * 0.5));
        this.col.push(c.r, c.g, c.b);
      }
    }
    const row = rows + 1;
    for (let k = 0; k < K - 1; k++) {
      for (let m = 0; m < rows; m++) {
        const a = start + k * row + m;
        const b = start + (k + 1) * row + m;
        const cc = a + 1;
        const d = b + 1;
        if (flip) this.idx.push(a, b, cc, b, d, cc);
        else this.idx.push(a, cc, b, b, cc, d);
      }
    }
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

function finProfile(q: number, skew: number): number {
  const k = Math.pow(q, skew);
  return Math.pow(Math.sin(Math.PI * Math.min(Math.max(k, 0), 1)), 0.7);
}

function buildFins(s: FishShape, finCol: THREE.Color, bodyCol: THREE.Color, bellyCol: THREE.Color, extra: THREE.Color): THREE.BufferGeometry {
  const fb = new FinBuilder();
  const base = new THREE.Color().copy(finCol).lerp(bodyCol, 0.35).multiplyScalar(0.85);
  const tip = new THREE.Color().copy(finCol).multiplyScalar(1.05);
  const K = 14;

  const spanFin = (span: FinSpan, up: boolean) => {
    const B: THREE.Vector3[] = [];
    const T: THREE.Vector3[] = [];
    for (let k = 0; k < K; k++) {
      const q = k / (K - 1);
      const t = lerp(span.t0, span.t1, q);
      const f = surfaceAt(s, t);
      const y = (up ? f.hTop : -f.hBot) * 0.96;
      const h = span.h * finProfile(q, span.skew) * (s.spiky && up ? 1 + 0.25 * (k % 2) : 1);
      B.push(new THREE.Vector3(f.x, y, 0));
      T.push(new THREE.Vector3(f.x - h * 0.55, y + (up ? h : -h), 0));
    }
    const dark = new THREE.Color().copy(base);
    fb.strip(B, T, dark, tip, 4);
  };
  s.dorsals.forEach((d) => spanFin(d, true));
  s.anals.forEach((a) => spanFin(a, false));

  // tail fin
  {
    const t0 = 0.0;
    const f = surfaceAt(s, t0 + 0.02);
    const half = Math.max((f.hTop + f.hBot) / 2, 0.012);
    const tailH = s.tailH ?? s.height * 0.45;
    const B: THREE.Vector3[] = [];
    const T: THREE.Vector3[] = [];
    const N = 15;
    for (let k = 0; k < N; k++) {
      const u = (k / (N - 1)) * 2 - 1;
      const yb = u * half * 0.95;
      const x0 = -0.5 + 0.02;
      B.push(new THREE.Vector3(x0, yb, 0));
      const lobe = s.tailRound ? Math.sqrt(Math.max(1 - u * u, 0)) : 0.42 + 0.58 * Math.abs(u);
      const lower = u < 0 ? 1 + (s.tailLower ?? 0) : 1;
      T.push(new THREE.Vector3(-0.5 - s.tailLen * lobe * lower, u * tailH * (s.tailRound ? 0.9 : 1), 0));
    }
    fb.strip(B, T, base, tip, 5);
  }

  // paired fins
  const paired = (tPos: number, len: number, y: number, outward: number, tilt: number, color: THREE.Color) => {
    for (const side of [1, -1]) {
      const f = surfaceAt(s, tPos);
      const B: THREE.Vector3[] = [];
      const T: THREE.Vector3[] = [];
      const K2 = 5;
      for (let k = 0; k < K2; k++) {
        const q = k / (K2 - 1);
        const bx = f.x - q * len * 0.25;
        const by = y * f.hBot - (q - 0.5) * 0.03;
        const bz = f.w * 0.82 * side;
        B.push(new THREE.Vector3(bx, by, bz));
        const l = len * (0.75 + 0.25 * Math.sin(q * Math.PI));
        T.push(new THREE.Vector3(bx - l, by - tilt * l, bz + side * outward * l));
      }
      const b2 = new THREE.Color().copy(color).lerp(bodyCol, 0.25);
      fb.strip(B, T, b2, color, 3, side < 0);
    }
  };
  paired(s.pectoral.t, s.pectoral.len, -0.28, 0.55, 0.12, base.clone().lerp(finCol, 0.5));
  paired(s.pelvic.t, s.pelvic.len, -0.82, 0.4, 0.35, extra);

  void bellyCol;
  return fb.build();
}

/* ------------------------------------------------------------------ */
/* Eyes + barbels                                                       */
/* ------------------------------------------------------------------ */

function colorize(g: THREE.BufferGeometry, color: THREE.Color): THREE.BufferGeometry {
  g.deleteAttribute('uv');
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

function buildExtras(s: FishShape, accent: THREE.Color): { geo: THREE.BufferGeometry; eye: THREE.Vector3 } {
  const parts: THREE.BufferGeometry[] = [];
  const eyePos = new THREE.Vector3();
  bodyPoint(s, s.eyeT, s.eyeTheta, eyePos);
  const side = new THREE.Vector3(0, 0, 1);
  for (const sign of [1, -1]) {
    const c = eyePos.clone();
    c.z *= sign;
    c.y *= 0.98;
    const dir = side.clone().multiplyScalar(sign);
    const ball = new THREE.SphereGeometry(s.eyeR, 18, 14);
    ball.translate(c.x, c.y, c.z);
    parts.push(colorize(ball, new THREE.Color(s.iris)));
    const pupil = new THREE.SphereGeometry(s.eyeR * 0.58, 14, 10);
    pupil.translate(c.x + dir.x * s.eyeR * 0.5, c.y, c.z + dir.z * s.eyeR * 0.55);
    parts.push(colorize(pupil, new THREE.Color('#050605')));
    const glint = new THREE.SphereGeometry(s.eyeR * 0.16, 8, 6);
    glint.translate(c.x + s.eyeR * 0.2, c.y + s.eyeR * 0.28, c.z + dir.z * s.eyeR * 0.98);
    parts.push(colorize(glint, new THREE.Color('#ffffff')));
  }

  if (s.barbels) {
    const nose = surfaceAt(s, 0.985);
    const lip = surfaceAt(s, 0.95);
    const defs: { from: THREE.Vector3; pts: THREE.Vector3[]; r: number }[] = [];
    if (s.barbels === 'carp') {
      for (const sign of [1, -1]) {
        defs.push({
          from: new THREE.Vector3(lip.x, -lip.hBot * 0.1, lip.w * 0.5 * sign),
          pts: [new THREE.Vector3(0.03, -0.012, 0.03 * sign), new THREE.Vector3(0.02, -0.03, 0.045 * sign)],
          r: 0.0045,
        });
      }
    } else {
      for (const sign of [1, -1]) {
        defs.push({
          from: new THREE.Vector3(lip.x + 0.02, lip.hTop * 0.05, lip.w * 0.7 * sign),
          pts: [new THREE.Vector3(0.05, 0.01, 0.09 * sign), new THREE.Vector3(0.0, 0.0, 0.2 * sign), new THREE.Vector3(-0.1, -0.02, 0.26 * sign)],
          r: 0.0065,
        });
        for (const k of [0.35, 1]) {
          defs.push({
            from: new THREE.Vector3(nose.x - 0.01, -lip.hBot * 0.55, k * lip.w * 0.55 * sign),
            pts: [new THREE.Vector3(0.0, -0.025, 0.03 * sign), new THREE.Vector3(-0.03, -0.05, 0.06 * sign * k)],
            r: 0.0048,
          });
        }
      }
    }
    for (const d of defs) {
      const curve = new THREE.CatmullRomCurve3([d.from, ...d.pts.map((p) => p.clone().add(d.from))]);
      const tube = new THREE.TubeGeometry(curve, 10, d.r, 6, false);
      parts.push(colorize(tube, accent.clone().lerp(new THREE.Color('#d9d2b0'), 0.25)));
    }
  }

  const geo = mergeGeometries(parts, false) ?? new THREE.BufferGeometry();
  parts.forEach((p) => p.dispose());
  return { geo, eye: eyePos };
}

/* ------------------------------------------------------------------ */
/* Painted skin texture                                                 */
/* ------------------------------------------------------------------ */

function paintSkin(species: FishSpecies, s: FishShape): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const W = 1024;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const vis = species.visual;
  const body = new THREE.Color(vis.body);
  const belly = new THREE.Color(vis.belly);
  const mid = body.clone().lerp(belly, 0.25 + s.silver * 0.5);
  const dark = body.clone().multiplyScalar(0.62);
  const css = (c: THREE.Color) => `#${c.getHexString()}`;
  const rng = mulberry32(species.id.length * 977 + 13);

  // countershading: v = 0 / 1 is the back, v = 0.5 the belly
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, css(dark));
  g.addColorStop(0.1, css(body));
  g.addColorStop(0.2, css(body));
  g.addColorStop(0.3, css(mid));
  g.addColorStop(0.42, css(belly));
  g.addColorStop(0.5, css(belly));
  g.addColorStop(0.58, css(belly));
  g.addColorStop(0.7, css(mid));
  g.addColorStop(0.8, css(body));
  g.addColorStop(0.9, css(body));
  g.addColorStop(1, css(dark));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // mottling for scaleless / marbled fish and general skin variation
  const blotches = s.mottled ? 520 : 140;
  for (let i = 0; i < blotches; i++) {
    const x = rng() * W;
    const y = rng() * H * (s.mottled ? 0.62 : 0.4);
    const r = (s.mottled ? 8 : 5) + rng() * (s.mottled ? 26 : 16);
    const lightBlob = rng() > 0.5;
    ctx.fillStyle = lightBlob ? 'rgba(255,240,200,0.07)' : 'rgba(0,0,0,0.10)';
    for (const yy of [y, H - y]) {
      ctx.beginPath();
      ctx.ellipse(x, yy, r * 1.6, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // scales
  if (s.scales > 0) {
    const sc = s.scales * 1.6;
    ctx.lineWidth = 1.3;
    for (let row = 0, y = 0; y < H + sc; row++, y += sc * 0.62) {
      for (let x = (row % 2) * sc * 0.5 - sc; x < W + sc; x += sc) {
        const cx = x + (rng() - 0.5) * 1.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.20)';
        ctx.beginPath();
        ctx.arc(cx, y, sc * 0.5, Math.PI * 0.55, Math.PI * 1.45);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.1 + s.silver * 0.2})`;
        ctx.beginPath();
        ctx.arc(cx + 1.6, y, sc * 0.5, Math.PI * 0.6, Math.PI * 1.4);
        ctx.stroke();
      }
    }
  }

  const mirror = (fn: (v: (n: number) => number) => void) => {
    fn((n) => n);
    fn((n) => 1 - n);
  };

  // species patterns
  if (vis.pattern === 'stripes') {
    const ac = new THREE.Color(vis.accent);
    const bars = [0.4, 0.5, 0.6, 0.7, 0.8];
    ctx.fillStyle = `rgba(${Math.round(ac.r * 255)},${Math.round(ac.g * 255)},${Math.round(ac.b * 255)},0.82)`;
    mirror((V) => {
      bars.forEach((u, i) => {
        const w = 0.028 - i * 0.002;
        const x0 = (u - w) * W;
        const x1 = (u + w) * W;
        ctx.beginPath();
        ctx.moveTo(x0, V(0) * H);
        ctx.lineTo(x1, V(0) * H);
        ctx.lineTo(x1 + 6, V(0.36) * H);
        ctx.lineTo(x0 - 6, V(0.36) * H);
        ctx.closePath();
        ctx.fill();
      });
    });
  } else if (vis.pattern === 'pike') {
    ctx.fillStyle = css(new THREE.Color(vis.accent).multiplyScalar(0.9));
    for (let row = 0; row < 5; row++) {
      const vRow = 0.07 + row * 0.07;
      for (let u = 0.1 + (row % 2) * 0.03; u < 0.9; u += 0.058) {
        const jitter = (rng() - 0.5) * 0.012;
        mirror((V) => {
          ctx.globalAlpha = 0.78;
          ctx.beginPath();
          ctx.ellipse((u + jitter) * W, V(vRow) * H, 17 + rng() * 6, 7 + rng() * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    ctx.globalAlpha = 1;
    // pale belly gets dark flecks
    ctx.fillStyle = 'rgba(30,40,20,0.35)';
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      ctx.arc(rng() * W, H * (0.38 + rng() * 0.24), 2 + rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (vis.pattern === 'spots') {
    ctx.fillStyle = css(new THREE.Color(vis.accent));
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(rng() * W, rng() * H * 0.36, 4 + rng() * 5, 0, Math.PI * 2);
      ctx.arc(rng() * W, H - rng() * H * 0.36, 4 + rng() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // lateral line
  mirror((V) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0.12 * W, V(0.26) * H);
    ctx.quadraticCurveTo(0.45 * W, V(0.245) * H, 0.76 * W, V(0.235) * H);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // gill cover, mouth, head darkening
  mirror((V) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0.762 * W, V(0.04) * H);
    ctx.quadraticCurveTo(0.735 * W, V(0.2) * H, 0.765 * W, V(0.4) * H);
    ctx.stroke();
    const gill = ctx.createRadialGradient(0.8 * W, V(0.22) * H, 4, 0.8 * W, V(0.22) * H, 70);
    gill.addColorStop(0, 'rgba(255,255,255,0.28)');
    gill.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gill;
    ctx.fillRect(0.7 * W, 0, 0.1 * W, H);
    ctx.strokeStyle = 'rgba(10,6,4,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0.93 * W, V(0.35) * H);
    ctx.lineTo(0.995 * W, V(0.32) * H);
    ctx.stroke();
  });
  const head = ctx.createLinearGradient(0.76 * W, 0, W, 0);
  head.addColorStop(0, 'rgba(0,0,0,0)');
  head.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = head;
  ctx.fillRect(0.76 * W, 0, 0.24 * W, H);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export interface FishModel {
  body: THREE.BufferGeometry;
  fins: THREE.BufferGeometry;
  extras: THREE.BufferGeometry;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  finMaterial: THREE.MeshStandardMaterial;
  extraMaterial: THREE.MeshPhysicalMaterial;
  texture: THREE.CanvasTexture | null;
  dispose(): void;
}

const cache = new Map<string, FishModel>();

export function getFishModel(speciesId: string): FishModel {
  const hit = cache.get(speciesId);
  if (hit) return hit;
  const species = SPECIES_BY_ID[speciesId] ?? SPECIES_BY_ID.common_roach;
  const s = shapeOf(species);
  const vis = species.visual;

  const body = buildBody(s);
  const fins = buildFins(s, new THREE.Color(vis.fin), new THREE.Color(vis.body), new THREE.Color(vis.belly), new THREE.Color(vis.fin).lerp(new THREE.Color('#e0603a'), s.spiky ? 0.7 : 0));
  const { geo: extras } = buildExtras(s, new THREE.Color(vis.accent));
  const texture = paintSkin(species, s);

  const bodyMaterial = patchWave(
    new THREE.MeshPhysicalMaterial({
      map: texture ?? undefined,
      color: texture ? '#ffffff' : vis.body,
      roughness: s.scales > 0 ? 0.36 : 0.5,
      metalness: 0.06 + s.silver * 0.14,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
      sheen: 0.4,
      sheenColor: new THREE.Color(vis.belly),
      sheenRoughness: 0.5,
    }),
  );
  const finMaterial = patchWave(
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, side: THREE.DoubleSide }),
  );
  const extraMaterial = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 });

  const model: FishModel = {
    body,
    fins,
    extras,
    bodyMaterial,
    finMaterial,
    extraMaterial,
    texture,
    dispose() {
      body.dispose();
      fins.dispose();
      extras.dispose();
      bodyMaterial.dispose();
      finMaterial.dispose();
      extraMaterial.dispose();
      texture?.dispose();
    },
  };
  cache.set(speciesId, model);
  return model;
}

export function warmFishModels(ids: string[]): () => void {
  const timers = ids.map((id, i) => window.setTimeout(() => getFishModel(id), 800 + i * 350));
  return () => timers.forEach((t) => window.clearTimeout(t));
}
