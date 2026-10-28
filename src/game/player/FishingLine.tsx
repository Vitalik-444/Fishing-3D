import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { runtime } from '../fishing/fishingRuntime';
import { bobber, rig } from './playerState';

const POINTS = 28;
const ATTACH_OFFSET = 0.26;

export function FishingLine() {
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(POINTS * 3), 3));
    const mat = new THREE.LineBasicMaterial({ color: '#eef2ec', transparent: true, opacity: 0.8 });
    const l = new THREE.Line(geo, mat);
    l.frustumCulled = false;
    return l;
  }, []);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  useFrame((state) => {
    const fishingState = useGameStore.getState().fishingState;
    line.visible = fishingState !== 'lineBroken';
    if (!line.visible) return;

    const attr = line.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const ax = rig.tip.x, ay = rig.tip.y, az = rig.tip.z;
    const bx = bobber.position.x, by = bobber.position.y + ATTACH_OFFSET, bz = bobber.position.z;
    const dist = Math.hypot(bx - ax, by - ay, bz - az);
    const t = state.clock.elapsedTime;

    const fighting = runtime.bobberMode === 'fighting';
    const ratio = fighting ? Math.min(1.2, runtime.tensionRatio) : 0;

    let slack = 0.03;
    if (runtime.bobberMode === 'hanging') slack = 0;
    else if (runtime.bobberMode === 'floating') slack = fishingState === 'bite' || fishingState === 'hooking' ? 0.012 : 0.045;
    else if (runtime.bobberMode === 'retrieving') slack = 0.015;
    else if (fighting) slack = Math.max(0.003, 0.05 * (1 - ratio * 2.2));
    const sag = Math.min(dist * slack, 2.2);
    const jitter = fighting ? ratio * 0.012 : 0;

    const mat = line.material as THREE.LineBasicMaterial;
    const warn = fighting ? Math.min(1, Math.max(0, (ratio - 0.6) / 0.4)) : 0;
    mat.color.setRGB(0.93, 0.95 - 0.6 * warn, 0.92 - 0.7 * warn);

    for (let i = 0; i < POINTS; i++) {
      const u = i / (POINTS - 1);
      const wob = jitter * Math.sin(u * Math.PI) * Math.sin(t * 38 + i * 1.7);
      arr[i * 3] = ax + (bx - ax) * u;
      arr[i * 3 + 1] = ay + (by - ay) * u - sag * 4 * u * (1 - u) + wob;
      arr[i * 3 + 2] = az + (bz - az) * u;
    }
    attr.needsUpdate = true;
  });

  return <primitive object={line} />;
}
