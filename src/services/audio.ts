import { useSettingsStore } from '../store/settingsStore';

export type SfxName =
  | 'cast'
  | 'splash'
  | 'nibble'
  | 'bite'
  | 'hook'
  | 'struggle'
  | 'warn'
  | 'snap'
  | 'escape'
  | 'catch'
  | 'levelup'
  | 'ui'
  | 'error'
  | 'coin'
  | 'reel';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let ambBus: GainNode | null = null;
let noise: AudioBuffer | null = null;
let rainGain: GainNode | null = null;
let ambientSources: AudioBufferSourceNode[] = [];
let ambientOscs: OscillatorNode[] = [];
let ambientOn = false;
let birdTimer: ReturnType<typeof setTimeout> | null = null;

function applyVolumes(): void {
  if (!ctx || !master || !sfxBus || !ambBus) return;
  const s = useSettingsStore.getState();
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(s.muted ? 0 : s.masterVolume, t, 0.03);
  sfxBus.gain.setTargetAtTime(s.sfxVolume, t, 0.03);
  ambBus.gain.setTargetAtTime(s.ambientVolume, t, 0.03);
}

useSettingsStore.subscribe(applyVolumes);

export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      master = ctx.createGain();
      sfxBus = ctx.createGain();
      ambBus = ctx.createGain();
      sfxBus.connect(master);
      ambBus.connect(master);
      master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      applyVolumes();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function ready(): boolean {
  return !!ctx && ctx.state === 'running' && !!sfxBus && !!noise;
}

function osc(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0): void {
  if (!ready() || !ctx || !sfxBus) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.012, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(sfxBus);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function noiseHit(dur: number, vol: number, kind: BiquadFilterType, f0: number, f1: number, q = 1, delay = 0): void {
  if (!ready() || !ctx || !sfxBus || !noise) return;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = kind;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(sfxBus);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
}

export function sfx(name: SfxName): void {
  if (!ready()) return;
  switch (name) {
    case 'cast':
      noiseHit(0.38, 0.35, 'bandpass', 2400, 500, 1.2);
      break;
    case 'splash':
      noiseHit(0.5, 0.5, 'lowpass', 2600, 300, 0.8);
      osc('sine', 260, 90, 0.18, 0.25);
      break;
    case 'nibble':
      osc('sine', 720, 640, 0.05, 0.1);
      noiseHit(0.1, 0.05, 'bandpass', 1500, 900, 2);
      break;
    case 'bite':
      osc('sine', 340, 190, 0.16, 0.4);
      osc('sine', 260, 150, 0.16, 0.3, 0.1);
      noiseHit(0.25, 0.25, 'lowpass', 1800, 400, 0.7);
      break;
    case 'hook':
      noiseHit(0.14, 0.4, 'highpass', 1800, 3000, 0.8);
      osc('triangle', 520, 780, 0.12, 0.2);
      break;
    case 'struggle':
      osc('sawtooth', 110, 70, 0.28, 0.1);
      noiseHit(0.3, 0.3, 'lowpass', 1500, 500, 0.8);
      break;
    case 'warn':
      osc('square', 880, 880, 0.09, 0.07);
      break;
    case 'snap':
      noiseHit(0.12, 0.6, 'highpass', 3000, 6000, 0.9);
      osc('sine', 900, 160, 0.4, 0.2);
      break;
    case 'escape':
      noiseHit(0.35, 0.35, 'lowpass', 2000, 400, 0.7);
      osc('triangle', 420, 180, 0.35, 0.15);
      break;
    case 'catch':
      noiseHit(0.4, 0.35, 'lowpass', 2200, 400, 0.8);
      osc('triangle', 523, 523, 0.18, 0.22, 0.1);
      osc('triangle', 659, 659, 0.18, 0.22, 0.22);
      osc('triangle', 784, 784, 0.3, 0.22, 0.34);
      break;
    case 'levelup':
      osc('triangle', 523, 523, 0.14, 0.2);
      osc('triangle', 659, 659, 0.14, 0.2, 0.12);
      osc('triangle', 784, 784, 0.14, 0.2, 0.24);
      osc('triangle', 1047, 1047, 0.4, 0.22, 0.36);
      break;
    case 'ui':
      osc('triangle', 600, 520, 0.06, 0.12);
      break;
    case 'error':
      osc('square', 200, 150, 0.14, 0.1);
      break;
    case 'coin':
      osc('triangle', 1318, 1318, 0.08, 0.14);
      osc('triangle', 1760, 1760, 0.2, 0.14, 0.07);
      break;
    case 'reel':
      osc('square', 1500, 1200, 0.025, 0.04);
      break;
  }
}

function chirp(): void {
  if (!ctx || !ambBus || !ambientOn) return;
  const base = 2200 + Math.random() * 2200;
  const notes = 2 + Math.floor(Math.random() * 4);
  const t0 = ctx.currentTime;
  for (let i = 0; i < notes; i++) {
    const t = t0 + i * 0.11;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(base * (1 + Math.random() * 0.15), t);
    o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g);
    g.connect(ambBus);
    o.start(t);
    o.stop(t + 0.12);
  }
}

function scheduleBird(): void {
  if (birdTimer !== null) clearTimeout(birdTimer);
  birdTimer = setTimeout(() => {
    birdTimer = null;
    if (!ambientOn) return;
    chirp();
    scheduleBird();
  }, 2500 + Math.random() * 6500);
}

function loopNoise(filterType: BiquadFilterType, freq: number, gain: number, lfoRate: number, lfoDepth: number): GainNode | null {
  if (!ctx || !ambBus || !noise) return null;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  f.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(ambBus);
  src.start(0, Math.random());
  ambientSources.push(src);
  if (lfoRate > 0) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = lfoRate;
    depth.gain.value = lfoDepth;
    lfo.connect(depth);
    depth.connect(g.gain);
    lfo.start();
    ambientOscs.push(lfo);
  }
  return g;
}

export function startAmbient(): void {
  if (!ctx || ambientOn) return;
  ambientOn = true;
  loopNoise('lowpass', 520, 0.2, 0.17, 0.08);
  loopNoise('bandpass', 900, 0.05, 0.05, 0.03);
  rainGain = loopNoise('highpass', 1800, 0, 0, 0);
  scheduleBird();
}

export function stopAmbient(): void {
  ambientOn = false;
  if (birdTimer !== null) {
    clearTimeout(birdTimer);
    birdTimer = null;
  }
  for (const s of ambientSources) {
    try { s.stop(); } catch { continue; }
    s.disconnect();
  }
  for (const o of ambientOscs) {
    try { o.stop(); } catch { continue; }
    o.disconnect();
  }
  ambientSources = [];
  ambientOscs = [];
  rainGain = null;
}

export function setRainLevel(level: number): void {
  if (!ctx || !rainGain) return;
  rainGain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.12, ctx.currentTime, 0.4);
}
