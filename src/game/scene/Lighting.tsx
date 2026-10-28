import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { env, updateEnvironment } from '../world/environment';
import { lerp } from '../world/math';
import { player } from '../player/playerState';

export function Lighting({ shadows, shadowMapSize }: { shadows: boolean; shadowMapSize: number }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sky = useRef<THREE.ShaderMaterial | null>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const fog = useMemo(() => new THREE.Fog('#c9dce8', 50, 240), []);

  useFrame((state, delta) => {
    const playing = useGameStore.getState().phase === 'playing';
    updateEnvironment(playing ? Math.min(delta, 0.05) : 0);

    state.scene.fog = fog;
    fog.color.copy(env.fogColor);
    fog.far = env.fogFar;
    state.gl.setClearColor(env.fogColor);
    state.gl.toneMappingExposure = env.exposure;

    const light = sun.current;
    if (light) {
      const p = player.position;
      target.position.set(p.x, 0, p.z - 10);
      light.position.set(
        target.position.x + env.sunDir.x * 90,
        env.sunDir.y * 90,
        target.position.z + env.sunDir.z * 90,
      );
      light.color.copy(env.sunColor);
      light.intensity = env.sunIntensity;
      target.updateMatrixWorld();
    }

    const h = hemi.current;
    if (h) {
      h.color.copy(env.hemiSky);
      h.groundColor.copy(env.hemiGround);
      h.intensity = env.hemiIntensity;
    }

    const mat = sky.current;
    if (mat) {
      const u = mat.uniforms;
      u.sunPosition.value.copy(env.sunDir).multiplyScalar(1000);
      u.rayleigh.value = lerp(2.6, 1.1, env.daylight) * (1 - 0.5 * env.cloud);
      u.turbidity.value = 6 + env.cloud * 9;
    }
  });

  return (
    <>
      <Sky
        ref={(m) => {
          sky.current = m ? (m.material as THREE.ShaderMaterial) : null;
        }}
        sunPosition={[-380, 300, -870]}
        turbidity={6}
        rayleigh={1.2}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
      />
      <hemisphereLight ref={hemi} args={['#bcd6f5', '#5d6a3c', 0.7]} />
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
