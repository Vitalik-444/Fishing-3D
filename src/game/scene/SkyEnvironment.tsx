import { useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { SUN_DIR } from '../world/constants';
import { env } from '../world/environment';

/**
 * Bakes the procedural sky into a PBR environment map once.
 * Glossy things (fish, bobber, rod, wet rocks) now reflect the sky instead of looking like flat plastic.
 */
export function SkyEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    const sky = new Sky();
    sky.scale.setScalar(1000);
    const u = sky.material.uniforms;
    u.turbidity.value = 5;
    u.rayleigh.value = 1.3;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.85;
    u.sunPosition.value.copy(SUN_DIR).multiplyScalar(1000);
    envScene.add(sky);
    const target = pmrem.fromScene(envScene, 0, 0.1, 2000);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.3;
    sky.geometry.dispose();
    sky.material.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);

  useFrame(() => {
    scene.environmentIntensity = 0.06 + 0.26 * env.daylight * (1 - 0.45 * env.cloud);
  });

  return null;
}
