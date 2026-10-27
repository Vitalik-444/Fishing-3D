import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { releaseLock, requestLock } from '../../services/pointerLock';
import { SettingsPanel } from './SettingsPanel';

function Hint() {
  const message = useGameStore((s) => s.lockMessage);
  return message ? <p className="lock-error" role="alert">{message}</p> : null;
}

function MainMenu() {
  const [view, setView] = useState<'main' | 'settings'>('main');

  const start = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    requestLock();
  };

  return (
    <div className="overlay overlay-menu">
      <div className="panel">
        {view === 'settings' ? (
          <SettingsPanel onBack={() => setView('main')} />
        ) : (
          <>
            <h1 className="title">Lakeside Angler</h1>
            <p className="lede">
              Stand on the shore, cast out over the water and wait for the float to move.
            </p>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={start}>Start fishing</button>
              <button type="button" className="btn" onClick={() => setView('settings')}>Settings</button>
            </div>
            <Hint />
            <p className="field-note">
              Clicking Start captures the mouse for looking around. Press <kbd>Esc</kbd> at any time to
              release it and pause.
            </p>
            <dl className="menu-controls">
              <div><dt><kbd>Mouse</kbd></dt><dd>Look around</dd></div>
              <div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dt><dd>Walk; hold <kbd>Shift</kbd> to hurry</dd></div>
              <div><dt><kbd>Space</kbd> / <kbd>Left click</kbd></dt><dd>Hold to charge, release to cast</dd></div>
              <div><dt><kbd>R</kbd></dt><dd>Reel the bobber back in</dd></div>
              <div><dt><kbd>Esc</kbd> / <kbd>P</kbd></dt><dd>Pause</dd></div>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}

function PauseMenu() {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const leave = () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    releaseLock();
    const s = useGameStore.getState();
    s.resetFishing();
    s.setPhase('menu');
  };

  return (
    <div className="overlay overlay-pause">
      <div className="panel">
        {view === 'settings' ? (
          <SettingsPanel onBack={() => setView('main')} />
        ) : (
          <>
            <h2 className="panel-title">Paused</h2>
            <div className="actions actions-stack">
              <button type="button" className="btn btn-primary" onClick={requestLock} autoFocus>Resume</button>
              <button type="button" className="btn" onClick={() => setView('settings')}>Settings</button>
              <button
                type="button"
                className={confirmLeave ? 'btn btn-danger' : 'btn'}
                onClick={leave}
                onBlur={() => setConfirmLeave(false)}
              >
                {confirmLeave ? 'Click again to leave' : 'Return to main menu'}
              </button>
            </div>
            <Hint />
          </>
        )}
      </div>
    </div>
  );
}

export function Overlays() {
  const phase = useGameStore((s) => s.phase);
  if (phase === 'menu') return <MainMenu />;
  if (phase === 'paused') return <PauseMenu />;
  return null;
}
