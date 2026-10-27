import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { runtime } from '../fishing/fishingRuntime';
import { bobber, rig } from './playerState';

const POINTS = 28;
const ATTACH_OFFSET = 0.26; // line ties to the top of the bobber's antenna

/** Thin line from rod tip to bobber with a little slack. Geometry buffer is reused every frame. */
export function FishingLine() {
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(POINTS * 3), 3));
    const mat = new THREE.LineBasicMaterial({ color: '#eef2ec', transparent: true, opacity: 0.8 });
    const l = new THREE.Line(geo, mat);
    l.frustumCulled = false; // positions change every frame; the static bounding sphere would be wrong
    return l;
  }, []);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  useFrame(() => {
    const attr = line.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const ax = rig.tip.x, ay = rig.tip.y, az = rig.tip.z;
    const bx = bobber.position.x, by = bobber.position.y + ATTACH_OFFSET, bz = bobber.position.z;
    const dist = Math.hypot(bx - ax, by - ay, bz - az);

    let slack = 0.03; // fraction of the span the line sags at its midpoint
    if (runtime.bobberMode === 'hanging') slack = 0;
    else if (runtime.bobberMode === 'floating') slack = 0.045;
    else if (runtime.bobberMode === 'retrieving') slack = 0.015;
    const sag = Math.min(dist * slack, 2.2);

    for (let i = 0; i < POINTS; i++) {
      const u = i / (POINTS - 1);
      arr[i * 3] = ax + (bx - ax) * u;
      arr[i * 3 + 1] = ay + (by - ay) * u - sag * 4 * u * (1 - u);
      arr[i * 3 + 2] = az + (bz - az) * u;
    }
    attr.needsUpdate = true;
  });

  return <primitive object={line} />;
}
