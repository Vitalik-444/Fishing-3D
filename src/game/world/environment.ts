import { Color, Vector3 } from 'three';
import { clamp, lerp } from './math';
import type { DayPeriod, Weather } from '../fishing/fishingTypes';

export const DAY_START = 5.5;
export const DAY_END = 21.5;
export const START_HOUR = 7.5;
export const REAL_SECONDS_PER_HOUR = 75;

const AZIMUTH = new Vector3(-0.38, 0, -0.87).normalize();

export const env = {
  hour: START_HOUR,
  weather: 'clear' as Weather,
  weatherTimer: 150,
  cloud: 0,
  rain: 0,
  daylight: 1,
  sunDir: new Vector3(-0.38, 0.3, -0.87).normalize(),
  sunColor: new Color('#fff0d2'),
  skyColor: new Color('#4a86c7'),
  horizonColor: new Color('#cde0eb'),
  fogColor: new Color('#c9dce8'),
  hemiSky: new Color('#bcd6f5'),
  hemiGround: new Color('#5d6a3c'),
  sunIntensity: 2.6,
  hemiIntensity: 0.7,
  exposure: 0.95,
  fogFar: 240,
};

const WEATHER_WEIGHTS: Record<Weather, number> = { clear: 0.5, cloudy: 0.3, rain: 0.2 };

const C = {
  sunLow: new Color('#ffb877'),
  sunHigh: new Color('#fff4e0'),
  sunGrey: new Color('#e6e9ee'),
  skyDay: new Color('#4a86c7'),
  skyDusk: new Color('#6f78a8'),
  skyGrey: new Color('#8c97a3'),
  horDay: new Color('#cde0eb'),
  horDusk: new Color('#f1b98f'),
  horGrey: new Color('#b5bec6'),
  hemiSkyDay: new Color('#bcd6f5'),
  hemiSkyDusk: new Color('#d9a98e'),
  hemiSkyGrey: new Color('#a5afb9'),
  groundDay: new Color('#5d6a3c'),
  groundDusk: new Color('#4a4a34'),
};

export function periodOf(hour: number): DayPeriod {
  if (hour < 9) return 'dawn';
  if (hour < 17) return 'day';
  return 'dusk';
}

export function formatClock(hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const WEATHER_LABEL: Record<Weather, string> = {
  clear: 'Clear',
  cloudy: 'Overcast',
  rain: 'Light rain',
};

function pickWeather(rng: () => number): Weather {
  let r = rng();
  for (const key of Object.keys(WEATHER_WEIGHTS) as Weather[]) {
    r -= WEATHER_WEIGHTS[key];
    if (r <= 0) return key;
  }
  return 'clear';
}

export function resetEnvironment(): void {
  env.hour = START_HOUR;
  env.weather = 'clear';
  env.weatherTimer = 150;
  env.cloud = 0;
  env.rain = 0;
  applyLook();
}

function applyLook(): void {
  const span = DAY_END - DAY_START;
  const phase = clamp((env.hour - DAY_START) / span, 0, 1);
  const high = Math.sin(Math.PI * phase);
  const elevation = lerp(0.08, 0.95, high);
  env.daylight = clamp(high * 1.3, 0.12, 1);
  const horizontal = Math.cos(elevation);
  env.sunDir.set(AZIMUTH.x * horizontal, Math.sin(elevation), AZIMUTH.z * horizontal).normalize();

  const grey = clamp(env.cloud * 0.55 + env.rain * 0.45, 0, 1);
  const lowSun = 1 - clamp(high * 1.5, 0, 1);

  env.sunColor.copy(C.sunHigh).lerp(C.sunLow, lowSun).lerp(C.sunGrey, grey * 0.7);
  env.skyColor.copy(C.skyDay).lerp(C.skyDusk, lowSun * 0.6).lerp(C.skyGrey, grey);
  env.horizonColor.copy(C.horDay).lerp(C.horDusk, lowSun * 0.7).lerp(C.horGrey, grey);
  env.fogColor.copy(env.horizonColor);
  env.hemiSky.copy(C.hemiSkyDay).lerp(C.hemiSkyDusk, lowSun * 0.6).lerp(C.hemiSkyGrey, grey);
  env.hemiGround.copy(C.groundDay).lerp(C.groundDusk, lowSun * 0.7);

  env.sunIntensity = lerp(0.9, 2.8, clamp(high * 1.4, 0, 1)) * (1 - 0.6 * grey);
  env.hemiIntensity = lerp(0.28, 0.6, clamp(high * 1.4, 0, 1)) * (1 - 0.15 * grey);
  env.exposure = lerp(0.8, 0.98, clamp(high * 1.5, 0, 1)) * (1 - 0.05 * grey);
  env.fogFar = lerp(240, 110, clamp(env.rain * 0.85 + env.cloud * 0.2, 0, 1));
}

export function updateEnvironment(dt: number, rng: () => number = Math.random): void {
  if (dt > 0) {
    env.hour += dt / REAL_SECONDS_PER_HOUR;
    if (env.hour >= DAY_END) env.hour = DAY_START;

    env.weatherTimer -= dt;
    if (env.weatherTimer <= 0) {
      env.weather = pickWeather(rng);
      env.weatherTimer = 120 + rng() * 150;
    }
    const cloudTarget = env.weather === 'clear' ? 0 : env.weather === 'cloudy' ? 0.75 : 1;
    const rainTarget = env.weather === 'rain' ? 1 : 0;
    const k = 1 - Math.exp(-0.45 * dt);
    env.cloud += (cloudTarget - env.cloud) * k;
    env.rain += (rainTarget - env.rain) * k;
  }
  applyLook();
}
