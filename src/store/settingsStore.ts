import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clamp } from '../game/world/math';

export type Quality = 'low' | 'medium' | 'high';

export interface SettingsData {
  mouseSensitivity: number;
  cameraSmoothing: number;
  quality: Quality;
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  muted: boolean;
  showHints: boolean;
}

interface SettingsState extends SettingsData {
  setMouseSensitivity: (v: number) => void;
  setCameraSmoothing: (v: number) => void;
  setQuality: (q: Quality) => void;
  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setAmbientVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setShowHints: (v: boolean) => void;
  resetSettings: () => void;
}

export const SETTINGS_DEFAULTS: SettingsData = {
  mouseSensitivity: 1,
  cameraSmoothing: 0.6,
  quality: 'medium',
  masterVolume: 0.7,
  sfxVolume: 0.8,
  ambientVolume: 0.6,
  muted: false,
  showHints: true,
};

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function sanitize(raw: unknown): Partial<SettingsData> {
  if (typeof raw !== 'object' || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<SettingsData> = {};
  if (finite(r.mouseSensitivity)) out.mouseSensitivity = clamp(r.mouseSensitivity, 0.3, 2.5);
  if (finite(r.cameraSmoothing)) out.cameraSmoothing = clamp(r.cameraSmoothing, 0, 1);
  if (r.quality === 'low' || r.quality === 'medium' || r.quality === 'high') out.quality = r.quality;
  if (finite(r.masterVolume)) out.masterVolume = clamp(r.masterVolume, 0, 1);
  if (finite(r.sfxVolume)) out.sfxVolume = clamp(r.sfxVolume, 0, 1);
  if (finite(r.ambientVolume)) out.ambientVolume = clamp(r.ambientVolume, 0, 1);
  if (typeof r.muted === 'boolean') out.muted = r.muted;
  if (typeof r.showHints === 'boolean') out.showHints = r.showHints;
  return out;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...SETTINGS_DEFAULTS,
      setMouseSensitivity: (v) => set({ mouseSensitivity: clamp(v, 0.3, 2.5) }),
      setCameraSmoothing: (v) => set({ cameraSmoothing: clamp(v, 0, 1) }),
      setQuality: (quality) => set({ quality }),
      setMasterVolume: (v) => set({ masterVolume: clamp(v, 0, 1) }),
      setSfxVolume: (v) => set({ sfxVolume: clamp(v, 0, 1) }),
      setAmbientVolume: (v) => set({ ambientVolume: clamp(v, 0, 1) }),
      setMuted: (muted) => set({ muted }),
      setShowHints: (showHints) => set({ showHints }),
      resetSettings: () => set({ ...SETTINGS_DEFAULTS }),
    }),
    {
      name: 'lakeside-angler:settings',
      version: 2,
      partialize: (s) => ({
        mouseSensitivity: s.mouseSensitivity,
        cameraSmoothing: s.cameraSmoothing,
        quality: s.quality,
        masterVolume: s.masterVolume,
        sfxVolume: s.sfxVolume,
        ambientVolume: s.ambientVolume,
        muted: s.muted,
        showHints: s.showHints,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
    },
  ),
);
