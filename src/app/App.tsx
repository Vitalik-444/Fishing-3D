import { lazy, Suspense } from 'react';
import { Hud } from '../components/hud/Hud';
import { Overlays } from '../components/menus/Overlays';
import { InputController } from './InputController';
import { PointerLockManager } from './PointerLockManager';
import { AudioController } from './AudioController';

const FishingGame = lazy(() => import('../game/FishingGame'));

export default function App() {
  return (
    <div className="app">
      <Suspense fallback={<div className="loading">Loading the lake…</div>}>
        <FishingGame />
      </Suspense>
      <Hud />
      <Overlays />
      <InputController />
      <PointerLockManager />
      <AudioController />
    </div>
  );
}
