import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clamp } from '../game/world/math';

export type Quality = 'low' | 'medium' | 'high';

interface SettingsData {
  mouseSensitivity: number; // 0.3 .. 2.5
  quality: Quality;
}

interface SettingsState extends SettingsData {
  setMouseSensitivity: (v: number) => void;
  setQuality: (q: Quality) => void;
}

const DEFAULTS: SettingsData = { mouseSensitivity: 1, quality: 'medium' };

/** Accepts anything that came out of localStorage and returns only valid values. */
function sanitize(raw: unknown): Partial<SettingsData> {
  if (typeof raw !== 'object' || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<SettingsData> = {};
  if (typeof r.mouseSensitivity === 'number' && Number.isFinite(r.mouseSensitivity)) {
    out.mouseSensitivity = clamp(r.mouseSensitivity, 0.3, 2.5);
  }
  if (r.quality === 'low' || r.quality === 'medium' || r.quality === 'high') {
    out.quality = r.quality;
  }
  return out;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setMouseSensitivity: (v) => set({ mouseSensitivity: clamp(v, 0.3, 2.5) }),
      setQuality: (quality) => set({ quality }),
    }),
    {
      name: 'lakeside-angler:settings',
      version: 1,
      partialize: (s) => ({ mouseSensitivity: s.mouseSensitivity, quality: s.quality }),
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
    },
  ),
);
