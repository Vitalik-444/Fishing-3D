import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, Backpack, Play, Settings, ShoppingBag, Fish, Coins } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { releaseLock, requestLock } from '../../services/pointerLock';
import { sfx } from '../../services/audio';
import { SettingsPanel } from './SettingsPanel';
import { EquipmentScreen } from '../screens/EquipmentScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { StatsScreen } from '../screens/StatsScreen';

type View = 'main' | 'equipment' | 'shop' | 'collection' | 'stats' | 'settings';

function Hint() {
  const message = useGameStore((s) => s.lockMessage);
  return message ? <p className="lock-error" role="alert">{message}</p> : null;
}

function SubScreen({ view, onBack }: { view: Exclude<View, 'main'>; onBack: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  switch (view) {
    case 'equipment':
      return <EquipmentScreen onBack={onBack} />;
    case 'shop':
      return <ShopScreen onBack={onBack} />;
    case 'collection':
      return <CollectionScreen onBack={onBack} />;
    case 'stats':
      return <StatsScreen onBack={onBack} />;
    case 'settings':
      return <SettingsPanel onBack={onBack} />;
  }
}

function go(setView: (v: View) => void, v: View) {
  sfx('ui');
  setView(v);
}

function MainMenu() {
  const [view, setView] = useState<View>('main');
  const [confirmNew, setConfirmNew] = useState(false);
  const hasSave = useGameStore((s) => s.hasSave);
  const profile = useGameStore((s) => s.profile);

  const begin = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    useGameStore.getState().resetFishing();
    requestLock();
  };

  const startNew = () => {
    if (hasSave && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    setConfirmNew(false);
    useGameStore.getState().startNewGame();
    begin();
  };

  const wide = view !== 'main' && view !== 'settings';

  return (
    <div className="overlay overlay-menu">
      <div className={wide ? 'panel panel-wide' : view === 'settings' ? 'panel panel-mid' : 'panel'}>
        {view !== 'main' ? (
          <SubScreen view={view} onBack={() => setView('main')} />
        ) : (
          <>
            <h1 className="title">Lakeside Angler</h1>
            <p className="lede">Stand on the shore, cast out over the water and wait for the float to move.</p>

            {hasSave && (
              <p className="save-line">
                <span><Fish size={14} /> Level {profile.level}</span>
                <span className="gold"><Coins size={14} /> {profile.money.toLocaleString('en-US')}</span>
                <span>{profile.stats.totalCatches} catches</span>
              </p>
            )}

            <div className="menu-list">
              <button type="button" className="btn btn-primary btn-wide" disabled={!hasSave} onClick={begin}>
                <Play size={16} /> Continue fishing {!hasSave && <small className="btn-hint">no saved game yet</small>}
              </button>
              <button
                type="button"
                className={confirmNew ? 'btn btn-danger btn-wide' : 'btn btn-wide'}
                onClick={startNew}
                onBlur={() => setConfirmNew(false)}
              >
                <Fish size={16} />
                {confirmNew ? 'Click again to erase the save and start over' : hasSave ? 'Start fishing (new game)' : 'Start fishing'}
              </button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'equipment')}><Backpack size={16} /> Equipment</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'shop')}><ShoppingBag size={16} /> Shop</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'collection')}><BookOpen size={16} /> Fish collection</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'stats')}><BarChart3 size={16} /> Statistics</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'settings')}><Settings size={16} /> Settings</button>
            </div>
            <Hint />
            <p className="field-note">
              Starting captures the mouse for looking around. Press <kbd>Esc</kbd> at any time to release it and pause.
              Progress is saved automatically in this browser.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function PauseMenu() {
  const [view, setView] = useState<View>('main');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const leave = () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    releaseLock();
    useGameStore.getState().leaveToMenu();
  };

  const wide = view !== 'main' && view !== 'settings';

  return (
    <div className="overlay overlay-pause">
      <div className={wide ? 'panel panel-wide' : view === 'settings' ? 'panel panel-mid' : 'panel'}>
        {view !== 'main' ? (
          <SubScreen view={view} onBack={() => setView('main')} />
        ) : (
          <>
            <h2 className="panel-title">Paused</h2>
            <div className="menu-list">
              <button type="button" className="btn btn-primary btn-wide" onClick={requestLock} autoFocus><Play size={16} /> Resume</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'equipment')}><Backpack size={16} /> Equipment</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'shop')}><ShoppingBag size={16} /> Shop</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'collection')}><BookOpen size={16} /> Fish collection</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'stats')}><BarChart3 size={16} /> Statistics</button>
              <button type="button" className="btn btn-wide" onClick={() => go(setView, 'settings')}><Settings size={16} /> Settings</button>
              <button
                type="button"
                className={confirmLeave ? 'btn btn-danger btn-wide' : 'btn btn-wide'}
                onClick={leave}
                onBlur={() => setConfirmLeave(false)}
              >
                {confirmLeave ? 'Click again to leave (progress is saved)' : 'Return to main menu'}
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
