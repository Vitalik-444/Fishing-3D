import { useEffect, useRef } from 'react';
import { Bug, Clock, Coins, Fish, Sun, Cloud, CloudRain } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { runtime } from '../../game/fishing/fishingRuntime';
import { gearOf } from '../../game/fishing/gear';
import { env, formatClock, WEATHER_LABEL } from '../../game/world/environment';
import { xpForLevel, MAX_LEVEL } from '../../game/progression';
import type { FishingState, Weather } from '../../game/fishing/fishingTypes';
import { BiteIndicator } from './BiteIndicator';
import { CatchPanel } from './CatchPanel';
import { FightHud } from './FightHud';
import { TouchControls } from './TouchControls';
import { BaitBar } from './BaitBar';
import { useSettingsStore } from '../../store/settingsStore';

const STATE_LABEL: Partial<Record<FishingState, string>> = {
  idle: 'Ready to cast',
  preparing: 'Hold to charge, release to cast',
  casting: 'Casting',
  waiting: 'Waiting for a bite',
  bite: 'Bite! Set the hook',
  hooking: 'Setting the hook',
  fighting: 'Fighting the fish',
  caught: 'Fish landed',
  escaped: 'The fish got away',
  lineBroken: 'Line broken',
};

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

function StatusLine() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = '';
    const loop = () => {
      const s = useGameStore.getState();
      let text = STATE_LABEL[s.fishingState] ?? s.fishingState;
      if (s.retrieving) text = 'Reeling in';
      else if (s.fishingState === 'waiting' && runtime.waitPhase === 'nibbling') text = 'The float is twitching...';
      if (text !== last && ref.current) {
        ref.current.textContent = text;
        last = text;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="hud-status" ref={ref} aria-live="polite" />;
}

function WorldClock() {
  const clock = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const icons = useRef<Record<Weather, HTMLSpanElement | null>>({ clear: null, cloudy: null, rain: null });
  useEffect(() => {
    let raf = 0;
    let lastClock = '';
    let lastWeather: Weather | '' = '';
    const loop = () => {
      const c = formatClock(env.hour);
      if (c !== lastClock && clock.current) {
        clock.current.textContent = c;
        lastClock = c;
      }
      if (env.weather !== lastWeather) {
        lastWeather = env.weather;
        if (label.current) label.current.textContent = WEATHER_LABEL[env.weather];
        (Object.keys(icons.current) as Weather[]).forEach((k) => {
          const el = icons.current[k];
          if (el) el.style.display = k === env.weather ? 'inline-flex' : 'none';
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="hud-row">
      <Clock size={15} />
      <span ref={clock}>07:30</span>
      <span className="hud-sep">/</span>
      <span ref={(el) => { icons.current.clear = el; }}><Sun size={15} /></span>
      <span ref={(el) => { icons.current.cloudy = el; }} style={{ display: 'none' }}><Cloud size={15} /></span>
      <span ref={(el) => { icons.current.rain = el; }} style={{ display: 'none' }}><CloudRain size={15} /></span>
      <span ref={label}>Clear</span>
    </div>
  );
}

function Controls() {
  const state = useGameStore((s) => s.fishingState);
  return (
    <dl className="hud-controls">
      {(state === 'idle' || state === 'preparing' || state === 'casting') && (
        <>
          <div><dt><kbd>Space</kbd> / <kbd>LMB</kbd></dt><dd>Hold to charge, release to cast</dd></div>
          <div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dt><dd>Walk the shore</dd></div>
        </>
      )}
      {state === 'waiting' && (
        <>
          <div><dt><kbd>Space</kbd> / <kbd>LMB</kbd></dt><dd>Set the hook when it bites</dd></div>
          <div><dt><kbd>R</kbd></dt><dd>Reel the line in</dd></div>
        </>
      )}
      {state === 'bite' && <div><dt><kbd>Space</kbd> / <kbd>LMB</kbd></dt><dd>Set the hook now</dd></div>}
      {state === 'fighting' && (
        <>
          <div><dt>Hold <kbd>Space</kbd> / <kbd>LMB</kbd></dt><dd>Reel in</dd></div>
          <div><dt>Hold <kbd>F</kbd> / <kbd>RMB</kbd></dt><dd>Give line, ease tension</dd></div>
        </>
      )}
      {state === 'caught' && (
        <>
          <div><dt><kbd>E</kbd></dt><dd>Keep the fish</dd></div>
          <div><dt><kbd>Q</kbd></dt><dd>Release the fish</dd></div>
        </>
      )}
      {state === 'idle' && <div><dt><kbd>1</kbd>-<kbd>6</kbd></dt><dd>Change bait</dd></div>}
      <div><dt><kbd>Esc</kbd> / <kbd>P</kbd></dt><dd>Pause, shop and menus</dd></div>
      <div><dt><kbd>H</kbd></dt><dd>Hide these hints</dd></div>
    </dl>
  );
}

export function Hud() {
  const phase = useGameStore((s) => s.phase);
  const profile = useGameStore((s) => s.profile);
  const toast = useGameStore((s) => s.toast);
  const banner = useGameStore((s) => s.banner);
  const showHints = useSettingsStore((s) => s.showHints);

  if (phase === 'menu') return null;
  const gear = gearOf(profile);
  const stock = profile.baitStock[gear.bait.id] ?? 0;
  const need = profile.level >= MAX_LEVEL ? 1 : xpForLevel(profile.level);
  const xpFrac = profile.level >= MAX_LEVEL ? 1 : profile.xp / need;

  return (
    <div className="hud">
      <div className="hud-panel hud-stats">
        <div className="hud-level">
          <span className="level-badge">{profile.level}</span>
          <div className="hud-level-info">
            <span>Level {profile.level}</span>
            <div className="xp"><div className="xp-fill" style={{ transform: `scaleX(${xpFrac})` }} /></div>
            <small>{profile.level >= MAX_LEVEL ? 'Max level' : `${profile.xp} / ${need} XP`}</small>
          </div>
        </div>
        <div className="hud-row hud-gold"><Coins size={15} /><span>{profile.money.toLocaleString('en-US')}</span></div>
        <div className="hud-row"><Fish size={15} /><span>{gear.rod.name}</span></div>
        <div className="hud-row">
          <Bug size={15} />
          <span>{gear.bait.name}, {gear.bait.reusable ? 'reusable' : `${stock} left`}</span>
        </div>
        <div className="hud-row hud-dim"><span>{gear.hook.name}</span></div>
        <WorldClock />
      </div>

      <div className="crosshair" aria-hidden />
      <BiteIndicator />
      <FightHud />

      <div className="hud-bottom">
        <PowerMeter />
        <StatusLine />
      </div>

      {toast && (
        <div className={`toast toast-${toast.kind}`} key={toast.id} role="status">
          {toast.text}
        </div>
      )}
      {banner && (
        <div className={`banner banner-${banner.kind}`} key={banner.id} role="alert">
          <strong>{banner.kind === 'broken' ? 'Line broken' : 'The fish got away'}</strong>
          <span>{banner.text}</span>
        </div>
      )}

      <CatchPanel />

      <BaitBar />

      {showHints && (
        <div className="hud-panel hud-help">
          <Controls />
        </div>
      )}
      <TouchControls />
    </div>
  );
}
