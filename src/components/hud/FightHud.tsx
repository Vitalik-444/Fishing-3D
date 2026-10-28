import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { runtime } from '../../game/fishing/fishingRuntime';
import { FIGHT } from '../../game/fishing/fishingConfig';

export function FightHud() {
  const state = useGameStore((s) => s.fishingState);
  const wrap = useRef<HTMLDivElement>(null);
  const tensionFill = useRef<HTMLDivElement>(null);
  const tensionText = useRef<HTMLSpanElement>(null);
  const distText = useRef<HTMLSpanElement>(null);
  const staminaFill = useRef<HTMLDivElement>(null);
  const progressFill = useRef<HTMLDivElement>(null);
  const phaseText = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== 'fighting' && state !== 'hooking') return;
    let raf = 0;
    const loop = () => {
      const r = runtime.tensionRatio;
      const level = r >= FIGHT.warningRatio ? 'danger' : r >= 0.55 ? 'high' : 'ok';
      if (wrap.current) wrap.current.dataset.level = level;
      if (tensionFill.current) tensionFill.current.style.transform = `scaleX(${Math.min(1, r)})`;
      if (tensionText.current) tensionText.current.textContent = `${runtime.tension.toFixed(1)} / ${runtime.capacity.toFixed(1)} kg`;
      if (distText.current) distText.current.textContent = `${Math.max(0, runtime.fightDistance).toFixed(1)} m`;
      if (staminaFill.current) staminaFill.current.style.transform = `scaleX(${runtime.fightStamina})`;
      if (progressFill.current) progressFill.current.style.transform = `scaleX(${runtime.fightProgress})`;
      if (phaseText.current) {
        let text = 'Hooked!';
        if (useGameStore.getState().fishingState === 'fighting') {
          if (r >= FIGHT.warningRatio) text = 'Line tension critical! Ease off!';
          else if (runtime.giveLine) text = 'Giving line';
          else if (runtime.fightPhase === 'pull') text = 'The fish is pulling hard';
          else text = 'The fish is tiring. Reel it in';
        }
        phaseText.current.textContent = text;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  if (state !== 'fighting' && state !== 'hooking') return null;

  return (
    <div className="fight" ref={wrap} data-level="ok">
      <div className="fight-phase" ref={phaseText} aria-live="polite">Hooked!</div>

      <div className="meter-row">
        <span className="meter-label">Line tension</span>
        <div className="meter meter-tension">
          <div className="meter-fill" ref={tensionFill} />
          <i className="meter-mark" style={{ left: `${FIGHT.warningRatio * 100}%` }} />
        </div>
        <span className="meter-value" ref={tensionText}>0.0 / 0.0 kg</span>
      </div>

      <div className="meter-row">
        <span className="meter-label">Fish stamina</span>
        <div className="meter meter-stamina"><div className="meter-fill" ref={staminaFill} /></div>
        <span className="meter-value" ref={distText}>0.0 m</span>
      </div>

      <div className="meter-row">
        <span className="meter-label">Reel progress</span>
        <div className="meter meter-progress"><div className="meter-fill" ref={progressFill} /></div>
        <span className="meter-value">&nbsp;</span>
      </div>
    </div>
  );
}
