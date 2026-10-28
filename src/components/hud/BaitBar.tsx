import { useGameStore } from '../../store/gameStore';
import { BAITS } from '../../game/data/baits';
import { quickSelectBait } from '../../game/fishing/fishingEngine';

export function BaitBar() {
  const profile = useGameStore((s) => s.profile);
  return (
    <div className="baitbar" role="group" aria-label="Bait">
      {BAITS.map((b, i) => {
        const stock = profile.baitStock[b.id] ?? 0;
        const locked = profile.level < b.unlockLevel && stock === 0;
        const selected = profile.selectedBait === b.id;
        const cls = ['bait-chip', selected ? 'bait-on' : '', stock === 0 ? 'bait-empty' : ''].join(' ').trim();
        return (
          <button
            key={b.id}
            type="button"
            className={cls}
            disabled={locked}
            onClick={() => quickSelectBait(i)}
            title={`${b.name}${locked ? ` (level ${b.unlockLevel})` : ''}`}
          >
            <kbd>{i + 1}</kbd>
            <span className="bait-name">{b.name.replace('Small Artificial ', '')}</span>
            <span className="bait-count">{b.reusable ? (stock > 0 ? '∞' : '0') : stock}</span>
          </button>
        );
      })}
    </div>
  );
}
