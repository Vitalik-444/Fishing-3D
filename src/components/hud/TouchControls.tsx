import { useGameStore } from '../../store/gameStore';
import {
  primaryDown,
  primaryUp,
  resolveCatch,
  retrieveLine,
  secondaryDown,
  secondaryUp,
} from '../../game/fishing/fishingEngine';
import { isTouchDevice } from '../../services/pointerLock';

export function TouchControls() {
  const state = useGameStore((s) => s.fishingState);
  const phase = useGameStore((s) => s.phase);
  const pending = useGameStore((s) => s.pendingCatch);
  if (!isTouchDevice() || phase !== 'playing') return null;

  const label =
    state === 'idle' || state === 'preparing' ? 'Cast' : state === 'fighting' ? 'Reel' : state === 'bite' || state === 'waiting' ? 'Hook' : '...';

  return (
    <div className="touch">
      <button type="button" className="touch-btn touch-menu" onClick={() => useGameStore.getState().setPhase('paused')}>
        Menu
      </button>
      {pending && state === 'caught' ? (
        <div className="touch-group">
          <button type="button" className="touch-btn" onClick={() => resolveCatch(true)}>Keep</button>
          <button type="button" className="touch-btn" onClick={() => resolveCatch(false)}>Release</button>
        </div>
      ) : (
        <div className="touch-group">
          {state === 'waiting' && (
            <button type="button" className="touch-btn" onClick={retrieveLine}>Reel in</button>
          )}
          {state === 'fighting' && (
            <button
              type="button"
              className="touch-btn"
              onPointerDown={secondaryDown}
              onPointerUp={secondaryUp}
              onPointerLeave={secondaryUp}
              onPointerCancel={secondaryUp}
            >
              Give line
            </button>
          )}
          <button
            type="button"
            className="touch-btn touch-main"
            onPointerDown={primaryDown}
            onPointerUp={primaryUp}
            onPointerLeave={primaryUp}
            onPointerCancel={primaryUp}
          >
            {label}
          </button>
        </div>
      )}
    </div>
  );
}
