import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { runtime } from '../../game/fishing/fishingRuntime';

export function BiteIndicator() {
  const state = useGameStore((s) => s.fishingState);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== 'bite') return;
    let raf = 0;
    const loop = () => {
      const f = Math.max(0, runtime.biteTimer / runtime.biteWindow);
      if (fill.current) fill.current.style.transform = `scaleX(${f})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  if (state !== 'bite') return null;
  return (
    <div className="bite" role="alert">
      <div className="bite-title">Bite!</div>
      <div className="bite-sub">Press <kbd>Space</kbd> or click to set the hook</div>
      <div className="bite-bar"><div className="bite-fill" ref={fill} /></div>
    </div>
  );
}
