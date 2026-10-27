import { smoothstep } from './math';
import { fbm } from './noise';

/** Everything about the shape of the world lives here so rendering, physics and gameplay agree. */
export const WATER_LEVEL = 0;
export const TERRAIN_SIZE = 360;
export const DEPTH_RANGE = 4.7; // depth texture encodes -h in [-0.5, 4.2]
export const LAKE = { cx: 0, cz: -62, rx: 88, rz: 60 };
export const EYE_HEIGHT = 1.65;
export const WALK_MIN_HEIGHT = 0.3; // can't walk into water
export const WALK_BOUNDS = { x: 60, zMax: 34 };

/** Ground height (metres) at world x/z. Negative = lake bed. */
export function terrainHeight(x: number, z: number): number {
  const dx = (x - LAKE.cx) / LAKE.rx;
  const dz = (z - LAKE.cz) / LAKE.rz;
  const e = Math.hypot(dx, dz) + (fbm(x * 0.018 + 11, z * 0.018 + 7, 3) - 0.44) * 0.16;
  const detail = (fbm(x * 0.22, z * 0.22, 3) - 0.44) * 0.35;

  if (e < 1) {
    const depth = Math.min((1 - e) * 16, 4.2);
    return -depth + detail * 0.3 * Math.min(1, (1 - e) * 10);
  }

  const k = e - 1;
  const lowland = k < 0.18 ? k * 9 : 1.62 + (k - 0.18) * 1.5;
  const ridge = fbm(x * 0.011 + 40, z * 0.011 - 9, 4);
  let hills = smoothstep(0.3, 1.5, k) * ridge * 54;
  const edge = Math.max(Math.abs(x), Math.abs(z));
  hills *= 1 - smoothstep(125, 178, edge); // fade hills out before the map edge (fog hides the rest)
  return lowland + hills + detail * smoothstep(0, 0.12, k);
}

function findSpawn() {
  const x = 0;
  let z = 2;
  while (z < 60 && terrainHeight(x, z) < 0.75) z += 0.5;
  return { x, z: z + 1 };
}
/** Where the player starts: on dry land a few metres from the waterline. */
export const SPAWN = findSpawn();
