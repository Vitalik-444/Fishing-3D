import { useSettingsStore, type Quality } from '../../store/settingsStore';

const QUALITIES: { id: Quality; label: string; hint: string }[] = [
  { id: 'low', label: 'Low', hint: 'No shadows, light foliage' },
  { id: 'medium', label: 'Medium', hint: 'Soft shadows, balanced' },
  { id: 'high', label: 'High', hint: 'Sharp shadows, dense foliage' },
];

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const sensitivity = useSettingsStore((s) => s.mouseSensitivity);
  const quality = useSettingsStore((s) => s.quality);
  const setSensitivity = useSettingsStore((s) => s.setMouseSensitivity);
  const setQuality = useSettingsStore((s) => s.setQuality);

  return (
    <>
      <h2 className="panel-title">Settings</h2>

      <label className="field">
        <span className="field-label">Mouse sensitivity <output>{sensitivity.toFixed(2)}</output></span>
        <input
          type="range" min={0.3} max={2.5} step={0.05}
          value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
        />
      </label>

      <fieldset className="field">
        <legend className="field-label">Graphics quality</legend>
        <div className="segmented" role="radiogroup">
          {QUALITIES.map((q) => (
            <button
              key={q.id} type="button" role="radio" aria-checked={quality === q.id}
              className={quality === q.id ? 'seg seg-on' : 'seg'}
              onClick={() => setQuality(q.id)}
              title={q.hint}
            >
              {q.label}
            </button>
          ))}
        </div>
        <p className="field-note">{QUALITIES.find((q) => q.id === quality)?.hint}. Changing quality rebuilds the scene.</p>
      </fieldset>

      <div className="actions">
        <button type="button" className="btn" onClick={onBack}>Back</button>
      </div>
    </>
  );
}
