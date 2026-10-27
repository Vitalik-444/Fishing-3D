import { useEffect, useRef } from 'react';
import { Bug, Coins, Fish, Star } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { runtime } from '../../game/fishing/fishingRuntime';
import type { FishingState } from '../../game/fishing/fishingTypes';

const STATE_LABEL: Partial<Record<FishingState, string>> = {
  idle: 'Ready to cast',
  preparing: 'Hold to charge, release to cast',
  casting: 'Casting',
  waiting: 'Waiting for a bite',
};

/** Cast-power bar. Driven by its own rAF loop writing to the DOM, so charging never re-renders React. */
function PowerMeter() {
  const wrap = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const show = useGameStore.getState().fishingState === 'preparing';
      if (wrap.current) wrap.current.style.opacity = show ? '1' : '0';
      if (fill.current) fill.current.style.transform = `scaleX(${runtime.charge})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="power" ref={wrap} aria-hidden>
      <div className="power-fill" ref={fill} />
    </div>
  );
}

function Controls() {
  return (
    <dl className="hud-controls">
      <div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dt><dd>Walk along the shore</dd></div>
      <div><dt><kbd>Space</kbd> or <kbd>Left click</kbd></dt><dd>Hold to charge, release to cast</dd></div>
      <div><dt><kbd>R</kbd></dt><dd>Reel the bobber in</dd></div>
      <div><dt><kbd>Esc</kbd> or <kbd>P</kbd></dt><dd>Pause and free the mouse</dd></div>
    </dl>
  );
}

export function Hud() {
  const phase = useGameStore((s) => s.phase);
  const fishingState = useGameStore((s) => s.fishingState);
  const retrieving = useGameStore((s) => s.retrieving);
  const profile = useGameStore((s) => s.profile);
  const toast = useGameStore((s) => s.toast);

  if (phase === 'menu') return null;
  const status = retrieving ? 'Reeling in' : STATE_LABEL[fishingState] ?? fishingState;

  return (
    <div className="hud">
      <div className="hud-panel hud-stats">
        <div className="hud-row"><Star size={15} /><span>Level {profile.level}</span></div>
        <div className="hud-row hud-gold"><Coins size={15} /><span>{profile.money}</span></div>
        <div className="hud-row"><Fish size={15} /><span>{profile.rodName}</span></div>
        <div className="hud-row"><Bug size={15} /><span>{profile.baitName}, {profile.baitCount} left</span></div>
      </div>

      <div className="crosshair" aria-hidden />

      <div className="hud-bottom">
        <PowerMeter />
        <div className="hud-status">{status}</div>
      </div>

      {toast && (
        <div className="toast" key={toast.id} role="status">
          {toast.text}
        </div>
      )}

      <div className="hud-panel hud-help">
        <Controls />
      </div>
    </div>
  );
}
