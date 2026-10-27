import * as THREE from 'three';
import { DEPTH_RANGE, TERRAIN_SIZE, terrainHeight } from './terrain';
import { clamp } from './math';

/** Bakes lake depth into a small texture so the water shader can tint shallows and draw shore foam. */
export function createDepthTexture(res = 384): THREE.DataTexture {
  const data = new Uint8Array(res * res); // res is a multiple of 4 -> rows are 4-byte aligned
  for (let j = 0; j < res; j++) {
    const z = (j / (res - 1) - 0.5) * TERRAIN_SIZE;
    for (let i = 0; i < res; i++) {
      const x = (i / (res - 1) - 0.5) * TERRAIN_SIZE;
      const h = terrainHeight(x, z);
      data[j * res + i] = Math.round(clamp((-h + 0.5) / DEPTH_RANGE, 0, 1) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, res, res, THREE.RedFormat, THREE.UnsignedByteType);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}
