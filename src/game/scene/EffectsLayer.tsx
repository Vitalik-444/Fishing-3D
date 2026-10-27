import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { dropletPool, fx, ripplePool } from '../effects';
import { WATER_LEVEL } from '../world/terrain';
import { waveHeight } from '../world/waves';
import { useGameStore } from '../../store/gameStore';

/** Expanding rings where the bobber lands, bobs and is dragged, plus splash droplets. */
export function EffectsLayer() {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const drops = useRef<THREE.InstancedMesh>(null);

  const ringGeo = useMemo(() => {
    const g = new THREE.RingGeometry(0.9, 1, 48);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const ringMats = useMemo(
    () => ripplePool.map(() => new THREE.MeshBasicMaterial({ color: '#eaf5f4', transparent: true, opacity: 0, depthWrite: false })),
    [],
  );
  const dropGeo = useMemo(() => new THREE.IcosahedronGeometry(0.035, 0), []);
  const dropMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f4fbfb', transparent: true, opacity: 0.85 }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(
    () => () => {
      ringGeo.dispose();
      ringMats.forEach((m) => m.dispose());
      dropGeo.dispose();
      dropMat.dispose();
    },
    [ringGeo, ringMats, dropGeo, dropMat],
  );

  useFrame((state, delta) => {
    const active = useGameStore.getState().phase === 'playing';
    const dt = active ? Math.min(delta, 0.05) : 0;
    fx.now += dt;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < ripplePool.length; i++) {
      const slot = ripplePool[i];
      const mesh = rings.current[i];
      if (!mesh) continue;
      if (!slot.active) { mesh.visible = false; continue; }
      const age = (fx.now - slot.t0) / slot.dur;
      if (age >= 1) { slot.active = false; mesh.visible = false; continue; }
      const ease = 1 - (1 - age) * (1 - age);
      const s = 0.08 + slot.maxR * ease;
      mesh.visible = true;
      mesh.position.set(slot.x, WATER_LEVEL + waveHeight(slot.x, slot.z, t) + 0.025, slot.z);
      mesh.scale.set(s, 1, s);
      ringMats[i].opacity = (1 - age) * (1 - age) * 0.7;
    }

    const inst = drops.current;
    if (inst) {
      for (let i = 0; i < dropletPool.length; i++) {
        const d = dropletPool[i];
        if (d.active) {
          d.life += dt;
          d.vy -= 9.8 * dt;
          d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vx * 0 + d.vz * dt;
          if (d.life >= d.maxLife || d.y < WATER_LEVEL - 0.05) d.active = false;
        }
        if (d.active) {
          const k = 1 - d.life / d.maxLife;
          dummy.position.set(d.x, d.y, d.z);
          dummy.scale.setScalar(0.4 + k * 0.8);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0);
        }
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {ripplePool.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => { rings.current[i] = m; }}
          geometry={ringGeo}
          material={ringMats[i]}
          visible={false}
          renderOrder={2}
        />
      ))}
      <instancedMesh ref={drops} args={[dropGeo, dropMat, dropletPool.length]} frustumCulled={false} renderOrder={3} />
    </>
  );
}
