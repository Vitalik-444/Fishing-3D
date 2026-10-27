import * as THREE from 'three';
import { EYE_HEIGHT, SPAWN, terrainHeight } from '../world/terrain';

/**
 * Shared, mutable per-frame state (position, aim, rod tip, bobber). Systems that run in the
 * render loop read and write these directly; React never subscribes to them.
 */
export const player = {
  position: new THREE.Vector3(SPAWN.x, terrainHeight(SPAWN.x, SPAWN.z) + EYE_HEIGHT, SPAWN.z),
  yaw: 0, // 0 = looking down -Z, towards the lake
  pitch: -0.1,
  bobPhase: 0,
  bob: 0,
};

export const rig = {
  tip: new THREE.Vector3(), // world position of the rod tip, refreshed every frame by FishingRod
};

export const bobber = {
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
};
