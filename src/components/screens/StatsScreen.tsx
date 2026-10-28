import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { FISH_SPECIES, SPECIES_BY_ID } from '../../game/data/fishSpecies';
import { MAX_LEVEL, xpForLevel } from '../../game/progression';
import { formatMoney, formatWeight } from '../../utils/format';

export function StatsScreen({ onBack }: { onBack: () => void }) {
  const profile = useGameStore((s) => s.profile);
  const st = profile.stats;
  const need = profile.level >= MAX_LEVEL ? 0 : xpForLevel(profile.level);
  const frac = need > 0 ? profile.xp / need : 1;
  const discovered = FISH_SPECIES.filter((s) => profile.species[s.id]).length;
  const encounters = st.totalCatches + st.escapes + st.lineBreaks;
  const rate = encounters > 0 ? Math.round((st.totalCatches / encounters) * 100) : 0;
  const largest = st.largestSpeciesId ? `${formatWeight(st.largestWeight)} ${SPECIES_BY_ID[st.largestSpeciesId].name}` : 'None yet';

  const rows: { label: string; value: string }[] = [
    { label: 'Total catches', value: String(st.totalCatches) },
    { label: 'Species discovered', value: `${discovered} / ${FISH_SPECIES.length}` },
    { label: 'Largest fish', value: largest },
    { label: 'Total weight caught', value: formatWeight(st.totalWeight) },
    { label: 'Coins earned from fish', value: formatMoney(st.moneyEarned) },
    { label: 'Fish released', value: String(st.released) },
    { label: 'Casts', value: String(st.casts) },
    { label: 'Fish lost', value: String(st.escapes) },
    { label: 'Lines broken', value: String(st.lineBreaks) },
    { label: 'Landing rate', value: `${rate}%` },
  ];

  return (
    <>
      <div className="screen-head">
        <button type="button" className="btn btn-icon" onClick={onBack} aria-label="Back"><ArrowLeft size={16} /> Back</button>
        <h2 className="panel-title">Statistics</h2>
      </div>

      <div className="levelbox">
        <div className="levelbox-top">
          <strong>Level {profile.level}</strong>
          <span>{profile.level >= MAX_LEVEL ? 'Max level' : `${profile.xp} / ${need} XP`}</span>
        </div>
        <div className="xp xp-big"><div className="xp-fill" style={{ transform: `scaleX(${frac})` }} /></div>
        <div className="levelbox-money">Coins: <span className="gold">{formatMoney(profile.money)}</span></div>
      </div>

      <dl className="stat-grid">
        {rows.map((r) => (
          <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>
        ))}
      </dl>
    </>
  );
}
