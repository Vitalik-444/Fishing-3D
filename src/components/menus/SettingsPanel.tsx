import { Volume2, VolumeX } from 'lucide-react';
import { useSettingsStore, type Quality } from '../../store/settingsStore';
import { sfx } from '../../services/audio';

const QUALITIES: { id: Quality; label: string; hint: string }[] = [
  { id: 'low', label: 'Low', hint: 'No shadows, light foliage, little rain' },
  { id: 'medium', label: 'Medium', hint: 'Soft shadows, balanced' },
  { id: 'high', label: 'High', hint: 'Sharp shadows, dense foliage' },
];

function Slider({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label} <output>{format(value)}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const s = useSettingsStore();
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <>
      <h2 className="panel-title">Settings</h2>

      <div className="settings-cols">
        <div>
          <h3 className="section-title">Audio</h3>
          <Slider label="Master volume" value={s.masterVolume} min={0} max={1} step={0.05} onChange={s.setMasterVolume} format={pct} />
          <Slider label="Sound effects" value={s.sfxVolume} min={0} max={1} step={0.05} onChange={s.setSfxVolume} format={pct} />
          <Slider label="Ambience" value={s.ambientVolume} min={0} max={1} step={0.05} onChange={s.setAmbientVolume} format={pct} />
          <button
            type="button"
            className="btn btn-icon"
            aria-pressed={s.muted}
            onClick={() => {
              s.setMuted(!s.muted);
              if (s.muted) sfx('ui');
            }}
          >
            {s.muted ? <VolumeX size={16} /> : <Volume2 size={16} />} {s.muted ? 'Unmute' : 'Mute all'}
          </button>
        </div>

        <div>
          <h3 className="section-title">Controls and graphics</h3>
          <Slider label="Mouse sensitivity" value={s.mouseSensitivity} min={0.3} max={2.5} step={0.05} onChange={s.setMouseSensitivity} format={(v) => v.toFixed(2)} />
          <Slider label="Camera smoothing" value={s.cameraSmoothing} min={0} max={1} step={0.05} onChange={s.setCameraSmoothing} format={pct} />

          <label className="check">
            <input type="checkbox" checked={s.showHints} onChange={(e) => s.setShowHints(e.target.checked)} />
            Show control hints in game (<kbd>H</kbd>)
          </label>

          <fieldset className="field">
            <legend className="field-label">Graphics quality</legend>
            <div className="segmented" role="radiogroup">
              {QUALITIES.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  role="radio"
                  aria-checked={s.quality === q.id}
                  className={s.quality === q.id ? 'seg seg-on' : 'seg'}
                  onClick={() => s.setQuality(q.id)}
                  title={q.hint}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <p className="field-note">{QUALITIES.find((q) => q.id === s.quality)?.hint}. Changing quality rebuilds the scene.</p>
          </fieldset>
        </div>
      </div>

      <h3 className="section-title">Control instructions</h3>
      <dl className="menu-controls menu-controls-wide">
        <div><dt><kbd>Mouse</kbd></dt><dd>Look around</dd></div>
        <div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <kbd>Shift</kbd></dt><dd>Walk along the shore (line in)</dd></div>
        <div><dt><kbd>Space</kbd> / <kbd>Left click</kbd></dt><dd>Hold to charge and release to cast. Press to set the hook on a bite. Hold to reel during a fight</dd></div>
        <div><dt><kbd>F</kbd> / <kbd>Right click</kbd></dt><dd>Hold to give line and ease the tension</dd></div>
        <div><dt><kbd>R</kbd></dt><dd>Reel the line in while waiting</dd></div>
        <div><dt><kbd>1</kbd>-<kbd>6</kbd></dt><dd>Choose bait while the line is in (bread, worms, maggots, corn, boilies, lure)</dd></div>
        <div><dt><kbd>H</kbd></dt><dd>Show or hide control hints</dd></div>
        <div><dt><kbd>E</kbd> / <kbd>Q</kbd></dt><dd>Keep or release a caught fish</dd></div>
        <div><dt><kbd>Esc</kbd> / <kbd>P</kbd></dt><dd>Release the mouse and open the pause menu</dd></div>
      </dl>

      <div className="actions">
        <button type="button" className="btn" onClick={onBack}>Back</button>
        <button type="button" className="btn" onClick={s.resetSettings}>Reset to defaults</button>
      </div>
    </>
  );
}
