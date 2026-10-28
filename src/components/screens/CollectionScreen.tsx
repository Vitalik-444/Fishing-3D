import { useState } from 'react';
import { ArrowLeft, Coins } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { FISH_SPECIES, RARITY_LABEL, SPECIES_BY_ID } from '../../game/data/fishSpecies';
import { BAITS } from '../../game/data/baits';
import type { CatchRecord } from '../../game/fishing/fishingTypes';
import { FishIllustration } from '../ui/FishIllustration';
import { sfx } from '../../services/audio';
import { formatLength, formatMoney, formatWeight, timeAgo } from '../../utils/format';

type Inspect = { kind: 'species'; id: string } | { kind: 'catch'; record: CatchRecord } | null;

function Detail({ inspect, onClose }: { inspect: NonNullable<Inspect>; onClose: () => void }) {
  const profile = useGameStore((s) => s.profile);
  const speciesId = inspect.kind === 'species' ? inspect.id : inspect.record.speciesId;
  const species = SPECIES_BY_ID[speciesId];
  const rec = profile.species[speciesId];

  return (
    <div className="modal" role="dialog" aria-label={species.name} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <FishIllustration visual={species.visual} className="modal-art" />
        <h3 className="item-name">{species.name} <span className={`rarity rarity-${species.rarity}`}>{RARITY_LABEL[species.rarity]}</span></h3>
        <p className="latin">{species.latin}</p>
        <p className="item-desc">{species.description}</p>
        <dl className="item-stats hints">
          <div><dt>Likes</dt><dd>{BAITS.filter((b) => species.baitAffinity[b.id] >= 1).map((b) => b.name.replace('Small Artificial ', '')).join(', ') || 'Unknown'}</dd></div>
          <div><dt>Most active</dt><dd>{(['dawn', 'day', 'dusk'] as const).filter((k) => species.time[k] >= 1.15).map((k) => (k === 'day' ? 'daytime' : k)).join(', ') || 'all day'}</dd></div>
          <div><dt>Water depth</dt><dd>{(['shallow', 'mid', 'deep'] as const).filter((k) => species.zones[k] >= 1.1).map((k) => (k === 'mid' ? 'mid-depth' : k)).join(', ') || 'any'}</dd></div>
        </dl>
        {inspect.kind === 'catch' ? (
          <dl className="item-stats">
            <div><dt>Weight</dt><dd>{formatWeight(inspect.record.weight)}</dd></div>
            <div><dt>Length</dt><dd>{formatLength(inspect.record.length)}</dd></div>
            <div><dt>Value</dt><dd>{formatMoney(inspect.record.value)}</dd></div>
            <div><dt>Experience</dt><dd>+{inspect.record.xp} XP</dd></div>
            <div><dt>Outcome</dt><dd>{inspect.record.kept ? 'Kept' : 'Released'}</dd></div>
            <div><dt>Caught</dt><dd>{timeAgo(inspect.record.time)}</dd></div>
            {inspect.record.trophy && <div><dt>Size</dt><dd className="gold">Trophy</dd></div>}
          </dl>
        ) : (
          rec && (
            <dl className="item-stats">
              <div><dt>Caught</dt><dd>{rec.caught}</dd></div>
              <div><dt>Largest</dt><dd>{formatWeight(rec.largestWeight)}</dd></div>
              <div><dt>Longest</dt><dd>{formatLength(rec.largestLength)}</dd></div>
              <div><dt>Total weight</dt><dd>{formatWeight(rec.totalWeight)}</dd></div>
              <div><dt>Best value</dt><dd>{formatMoney(rec.bestValue)}</dd></div>
            </dl>
          )
        )}
        <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export function CollectionScreen({ onBack }: { onBack: () => void }) {
  const profile = useGameStore((s) => s.profile);
  const [inspect, setInspect] = useState<Inspect>(null);

  const discovered = FISH_SPECIES.filter((s) => profile.species[s.id]).length;
  const best = profile.stats.bestSpeciesId ? SPECIES_BY_ID[profile.stats.bestSpeciesId] : null;

  const open = (i: Inspect) => {
    sfx('ui');
    setInspect(i);
  };

  return (
    <>
      <div className="screen-head">
        <button type="button" className="btn btn-icon" onClick={onBack} aria-label="Back"><ArrowLeft size={16} /> Back</button>
        <h2 className="panel-title">Fish collection</h2>
      </div>

      <dl className="summary">
        <div><dt>Discovered</dt><dd>{discovered} / {FISH_SPECIES.length}</dd></div>
        <div><dt>Total caught</dt><dd>{profile.stats.totalCatches}</dd></div>
        <div><dt>Total weight</dt><dd>{formatWeight(profile.stats.totalWeight)}</dd></div>
        <div>
          <dt>Highest-value catch</dt>
          <dd className="gold">{best ? <><Coins size={14} /> {formatMoney(profile.stats.bestValue)} <small>{best.name}</small></> : 'None yet'}</dd>
        </div>
      </dl>

      <div className="grid grid-fish">
        {FISH_SPECIES.map((s) => {
          const rec = profile.species[s.id];
          if (!rec) {
            return (
              <article key={s.id} className="fish-card fish-unknown">
                <FishIllustration visual={s.visual} silhouette className="fish-art" />
                <h3 className="item-name">Unknown species</h3>
                <p className="item-desc">Catch one to add it to your collection.</p>
              </article>
            );
          }
          return (
            <button key={s.id} type="button" className="fish-card" onClick={() => open({ kind: 'species', id: s.id })}>
              <FishIllustration visual={s.visual} className="fish-art" />
              <h3 className="item-name">{s.name}</h3>
              <span className={`rarity rarity-${s.rarity}`}>{RARITY_LABEL[s.rarity]}</span>
              <dl className="item-stats item-stats-tight">
                <div><dt>Caught</dt><dd>{rec.caught}</dd></div>
                <div><dt>Largest</dt><dd>{formatWeight(rec.largestWeight)}</dd></div>
                <div><dt>Best value</dt><dd>{formatMoney(rec.bestValue)}</dd></div>
              </dl>
            </button>
          );
        })}
      </div>

      <h3 className="section-title">Recent catches</h3>
      {profile.recent.length === 0 ? (
        <p className="empty">No catches yet. Cast a line!</p>
      ) : (
        <ul className="recent">
          {profile.recent.map((r) => (
            <li key={r.id}>
              <button type="button" className="recent-row" onClick={() => open({ kind: 'catch', record: r })}>
                <FishIllustration visual={SPECIES_BY_ID[r.speciesId].visual} className="recent-art" />
                <span className="recent-name">{SPECIES_BY_ID[r.speciesId].name}{r.trophy ? ' (trophy)' : ''}</span>
                <span>{formatWeight(r.weight)}</span>
                <span>{formatLength(r.length)}</span>
                <span className="gold">{r.kept ? formatMoney(r.value) : 'released'}</span>
                <span className="recent-time">{timeAgo(r.time)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {inspect && <Detail inspect={inspect} onClose={() => setInspect(null)} />}
    </>
  );
}
