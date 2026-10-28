export const fx = { now: 0 };

export interface RippleSlot { active: boolean; x: number; z: number; t0: number; dur: number; maxR: number }
export const ripplePool: RippleSlot[] = Array.from({ length: 20 }, () => ({
  active: false, x: 0, z: 0, t0: 0, dur: 1, maxR: 1,
}));
let rippleCursor = 0;

export function spawnRipple(x: number, z: number, maxR = 1.6, dur = 1.6): void {
  const s = ripplePool[rippleCursor++ % ripplePool.length];
  s.active = true; s.x = x; s.z = z; s.t0 = fx.now; s.dur = dur; s.maxR = maxR;
}

export interface Droplet {
  active: boolean; x: number; y: number; z: number;
  vx: number; vy: number; vz: number; life: number; maxLife: number;
}
export const dropletPool: Droplet[] = Array.from({ length: 48 }, () => ({
  active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1,
}));
let dropCursor = 0;

export function spawnSplash(x: number, y: number, z: number, strength = 1): void {
  const n = Math.round(10 + 14 * strength);
  for (let i = 0; i < n; i++) {
    const d = dropletPool[dropCursor++ % dropletPool.length];
    const a = Math.random() * Math.PI * 2;
    const sp = (0.4 + Math.random() * 0.9) * strength;
    d.active = true; d.x = x; d.y = y; d.z = z;
    d.vx = Math.cos(a) * sp; d.vz = Math.sin(a) * sp;
    d.vy = (1.6 + Math.random() * 2.2) * strength;
    d.life = 0; d.maxLife = 0.55 + Math.random() * 0.35;
  }
}
