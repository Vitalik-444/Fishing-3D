import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { registerLockTarget } from '../services/pointerLock';
import { QUALITY } from './qualityConfig';
import { Lighting } from './scene/Lighting';
import { Terrain } from './scene/Terrain';
import { Water } from './scene/Water';
import { Vegetation } from './scene/Vegetation';
import { EffectsLayer } from './scene/EffectsLayer';
import { Rain } from './scene/Rain';
import { FirstPersonController } from './player/FirstPersonController';
import { FishingRod } from './player/FishingRod';
import { Bobber } from './player/Bobber';
import { FishingLine } from './player/FishingLine';
import { FishCatch } from './player/FishCatch';
import { FishShadow } from './player/FishShadow';
import { FOG_COLOR } from './world/constants';

export default function FishingGame() {
  const qualityKey = useSettingsStore((s) => s.quality);
  const q = QUALITY[qualityKey];

  useEffect(() => {
    useGameStore.getState().resetFishing();
  }, [qualityKey]);

  return (
    <Canvas
      key={qualityKey}
      className="game-canvas"
      shadows={q.shadows ? 'soft' : false}
      dpr={q.dpr}
      camera={{ fov: 65, near: 0.1, far: 900 }}
      gl={{
        antialias: q.antialias,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(FOG_COLOR);
        registerLockTarget(gl.domElement);
      }}
    >
      <Lighting shadows={q.shadows} shadowMapSize={q.shadowMapSize} />
      <Terrain receiveShadow={q.shadows} />
      <Water />
      <Vegetation quality={q} />

      <FirstPersonController />
      <FishingRod />
      <Bobber />
      <FishingLine />
      <FishShadow />
      <FishCatch />
      <EffectsLayer />
      <Rain count={q.rain} />
    </Canvas>
  );
}
