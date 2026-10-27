/**
 * Wave field shared by the water shader (GLSL) and gameplay code (bobber, ripples),
 * generated from the same table so the bobber really rides the visible waves.
 */
export interface Wave { dx: number; dz: number; k: number; w: number; a: number }

const mk = (angle: number, k: number, w: number, a: number): Wave => ({
  dx: Math.cos(angle), dz: Math.sin(angle), k, w, a,
});

export const WAVES: Wave[] = [
  mk(0.6, 0.55, 1.0, 0.045),
  mk(2.1, 0.9, 1.3, 0.028),
  mk(-1.0, 1.6, 1.8, 0.014),
  mk(3.6, 2.8, 2.4, 0.006),
];

export function waveHeight(x: number, z: number, t: number): number {
  let h = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const w = WAVES[i];
    h += w.a * Math.sin((x * w.dx + z * w.dz) * w.k + t * w.w);
  }
  return h;
}

const f = (n: number) => n.toFixed(5);
export const WAVE_GLSL = `
float waveH(vec2 p, float t) {
  float h = 0.0;
  ${WAVES.map((w) => `h += ${f(w.a)} * sin(dot(p, vec2(${f(w.dx)}, ${f(w.dz)})) * ${f(w.k)} + t * ${f(w.w)});`).join('\n  ')}
  return h;
}
`;
