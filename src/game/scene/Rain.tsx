import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { env } from '../world/environment';
import { player } from '../player/playerState';

const RADIUS = 16;
const HEIGHT = 14;
const SPEED = 15;

export function Rain({ count }: { count: number }) {
  const data = useMemo(() => {
    const ox = new Float32Array(count);
    const oz = new Float32Array(count);
    const oy = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * RADIUS;
      ox[i] = Math.cos(a) * r;
      oz[i] = Math.sin(a) * r;
      oy[i] = Math.random() * HEIGHT;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    const mat = new THREE.LineBasicMaterial({ color: '#d4dde6', transparent: true, opacity: 0, depthWrite: false, fog: false });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 4;
    return { ox, oz, oy, lines };
  }, [count]);

  useEffect(
    () => () => {
      data.lines.geometry.dispose();
      (data.lines.material as THREE.Material).dispose();
    },
    [data],
  );

  useFrame((_, delta) => {
    const lines = data.lines;
    const mat = lines.material as THREE.LineBasicMaterial;
    if (env.rain < 0.03) {
      lines.visible = false;
      return;
    }
    lines.visible = true;
    mat.opacity = env.rain * 0.4;
    const dt = useGameStore.getState().phase === 'playing' ? Math.min(delta, 0.05) : 0;
    const attr = lines.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const px = player.position.x;
    const pz = player.position.z;
    const base = player.position.y - 2;
    const visible = Math.floor(count * Math.min(1, env.rain));
    for (let i = 0; i < count; i++) {
      if (i >= visible) {
        arr.fill(0, i * 6, i * 6 + 6);
        continue;
      }
      data.oy[i] -= SPEED * dt;
      if (data.oy[i] < 0) data.oy[i] += HEIGHT;
      const x = px + data.ox[i];
      const z = pz + data.oz[i];
      const y = base + data.oy[i];
      arr[i * 6] = x;
      arr[i * 6 + 1] = y;
      arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x + 0.06;
      arr[i * 6 + 4] = y + 0.55;
      arr[i * 6 + 5] = z + 0.02;
    }
    attr.needsUpdate = true;
  });

  return <primitive object={data.lines} />;
}
