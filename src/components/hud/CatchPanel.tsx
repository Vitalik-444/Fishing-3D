import { Coins, Sparkles, Star, Trophy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { resolveCatch } from '../../game/fishing/fishingEngine';
import { RARITY_LABEL, SPECIES_BY_ID } from '../../game/data/fishSpecies';
import { FishIllustration } from '../ui/FishIllustration';
import { formatLength, formatWeight } from '../../utils/format';

export function CatchPanel() {
  const pending = useGameStore((s) => s.pendingCatch);
  const state = useGameStore((s) => s.fishingState);
  if (!pending || state !== 'caught') return null;

  const { fish } = pending;
  const species = SPECIES_BY_ID[fish.speciesId];

  return (
    <div className="catch" role="dialog" aria-label="Fish caught">
      <div className="catch-head">
        <span className="catch-kicker">Fish caught</span>
        <h2 className="catch-name">{species.name}</h2>
        <span className={`rarity rarity-${species.rarity}`}>{RARITY_LABEL[species.rarity]}</span>
      </div>

      <FishIllustration visual={species.visual} className="catch-art" />

      <div className="catch-flags">
        {pending.newSpecies && <span className="flag flag-new"><Sparkles size={13} /> New species</span>}
        {pending.newRecord && <span className="flag"><Trophy size={13} /> Personal best</span>}
        {fish.trophy && <span className="flag flag-gold"><Trophy size={13} /> Trophy size</span>}
      </div>

      <dl className="catch-stats">
        <div><dt>Weight</dt><dd>{formatWeight(fish.weight)}</dd></div>
        <div><dt>Length</dt><dd>{formatLength(fish.length)}</dd></div>
        <div><dt>Reward</dt><dd className="gold"><Coins size={14} /> {fish.value}</dd></div>
        <div><dt>Experience</dt><dd><Star size={14} /> +{fish.xp} XP</dd></div>
      </dl>

      <div className="catch-actions">
        <button type="button" className="btn btn-primary" onClick={() => resolveCatch(true)}>
          Keep <kbd>E</kbd>
        </button>
        <button type="button" className="btn" onClick={() => resolveCatch(false)}>
          Release <kbd>Q</kbd>
        </button>
      </div>
      <p className="catch-note">Keeping sells the fish for coins. Releasing it earns no coins. XP and the log entry count either way.</p>
    </div>
  );
}
