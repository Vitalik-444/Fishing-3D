import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { env } from '../game/world/environment';
import { setRainLevel, startAmbient, stopAmbient } from '../services/audio';

export function AudioController() {
  useEffect(() => {
    let raf = 0;
    let active = false;
    let lastRain = -1;

    const sync = () => {
      const playing = useGameStore.getState().phase === 'playing';
      if (playing && !active) {
        startAmbient();
        active = true;
        lastRain = -1;
      } else if (!playing && active) {
        stopAmbient();
        active = false;
      }
      if (active) {
        const rain = Math.round(env.rain * 20) / 20;
        if (rain !== lastRain) {
          setRainLevel(rain);
          lastRain = rain;
        }
      }
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);

    return () => {
      cancelAnimationFrame(raf);
      stopAmbient();
    };
  }, []);

  return null;
}
