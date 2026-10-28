import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { BAITS } from '../../game/data/baits';
import { itemsOf, statLines } from '../../game/data/equipment';
import { gearOf } from '../../game/fishing/gear';
import { sfx } from '../../services/audio';
import { CategoryTabs, type Tab } from './CategoryTabs';
import { ItemCard } from './ItemCard';

export function EquipmentScreen({ onBack }: { onBack: () => void }) {
  const profile = useGameStore((s) => s.profile);
  const equipItem = useGameStore((s) => s.equipItem);
  const selectBait = useGameStore((s) => s.selectBait);
  const [tab, setTab] = useState<Tab>('rod');
  const [message, setMessage] = useState('');
  const gear = gearOf(profile);

  const report = (r: { ok: boolean; message: string }) => {
    setMessage(r.message);
    sfx(r.ok ? 'ui' : 'error');
  };

  const ownedBaits = BAITS.filter((b) => (profile.baitStock[b.id] ?? 0) > 0);

  return (
    <>
      <div className="screen-head">
        <button type="button" className="btn btn-icon" onClick={onBack} aria-label="Back"><ArrowLeft size={16} /> Back</button>
        <h2 className="panel-title">Equipment</h2>
      </div>

      <p className="loadout">
        <span>{gear.rod.name}</span><span>{gear.reel.name}</span><span>{gear.line.name}</span><span>{gear.hook.name}</span>
        <span>{gear.bait.name}{gear.bait.reusable ? '' : ` × ${profile.baitStock[gear.bait.id] ?? 0}`}</span>
      </p>

      <CategoryTabs value={tab} onChange={setTab} />

      <div className="grid" role="tabpanel">
        {tab === 'bait' ? (
          ownedBaits.length === 0 ? (
            <p className="empty">You have no bait. Buy some in the shop.</p>
          ) : (
            ownedBaits.map((b) => {
              const selected = profile.selectedBait === b.id;
              return (
                <ItemCard
                  key={b.id}
                  name={b.name}
                  description={b.description}
                  stats={[{ label: 'In stock', value: b.reusable ? 'Reusable' : String(profile.baitStock[b.id] ?? 0) }]}
                  badge={selected ? 'Selected' : undefined}
                  highlight={selected}
                  footer={
                    <button type="button" className="btn btn-sm" disabled={selected} onClick={() => report(selectBait(b.id))}>
                      {selected ? 'Selected' : 'Use this bait'}
                    </button>
                  }
                />
              );
            })
          )
        ) : (
          itemsOf(tab)
            .filter((i) => profile.owned[i.category].includes(i.id))
            .map((i) => {
              const equipped = profile.equipped[i.category] === i.id;
              return (
                <ItemCard
                  key={i.id}
                  name={i.name}
                  description={i.description}
                  stats={statLines(i)}
                  badge={equipped ? 'Equipped' : undefined}
                  highlight={equipped}
                  footer={
                    <button type="button" className="btn btn-sm" disabled={equipped} onClick={() => report(equipItem(i.id))}>
                      {equipped ? 'Equipped' : 'Equip'}
                    </button>
                  }
                />
              );
            })
        )}
      </div>
      <p className="screen-msg" role="status">{message}</p>
    </>
  );
}
