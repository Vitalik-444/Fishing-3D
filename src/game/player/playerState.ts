import * as THREE from 'three';
import { EYE_HEIGHT, SPAWN, terrainHeight } from '../world/terrain';

export const player = {
  position: new THREE.Vector3(SPAWN.x, terrainHeight(SPAWN.x, SPAWN.z) + EYE_HEIGHT, SPAWN.z),
  yaw: 0,
  pitch: -0.1,
  bobPhase: 0,
  bob: 0,
};

export const rig = {
  tip: new THREE.Vector3(),
};

export const bobber = {
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
};
