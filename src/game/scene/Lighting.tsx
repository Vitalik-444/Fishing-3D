import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { SUN_DIR, FOG_COLOR } from '../world/constants';
import { player } from '../player/playerState';

/** Sky, fog, hemisphere fill and a sun whose shadow box follows the player. */
export function Lighting({ shadows, shadowMapSize }: { shadows: boolean; shadowMapSize: number }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sunPosition = useMemo(() => SUN_DIR.clone().multiplyScalar(1000).toArray() as [number, number, number], []);

  useFrame(() => {
    const light = sun.current;
    if (!light) return;
    const p = player.position;
    target.position.set(p.x, 0, p.z - 10);
    light.position.set(target.position.x + SUN_DIR.x * 90, SUN_DIR.y * 90, target.position.z + SUN_DIR.z * 90);
    target.updateMatrixWorld();
  });

  return (
    <>
      <fog attach="fog" args={[FOG_COLOR, 50, 240]} />
      <Sky sunPosition={sunPosition} turbidity={6} rayleigh={1.2} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <hemisphereLight args={['#bcd6f5', '#5d6a3c', 0.7]} />
      <primitive object={target} />
      <directionalLight
        ref={sun}
        color="#fff0d2"
        intensity={2.6}
        castShadow={shadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        target={target}
      />
    </>
  );
}
