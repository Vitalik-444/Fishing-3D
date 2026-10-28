import { useState } from 'react';
import { ArrowLeft, Coins } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { BAITS } from '../../game/data/baits';
import { itemsOf, statLines } from '../../game/data/equipment';
import { sfx } from '../../services/audio';
import { formatMoney } from '../../utils/format';
import { CategoryTabs, type Tab } from './CategoryTabs';
import { ItemCard } from './ItemCard';

export function ShopScreen({ onBack }: { onBack: () => void }) {
  const profile = useGameStore((s) => s.profile);
  const buyItem = useGameStore((s) => s.buyItem);
  const equipItem = useGameStore((s) => s.equipItem);
  const buyBait = useGameStore((s) => s.buyBait);
  const [tab, setTab] = useState<Tab>('rod');
  const [message, setMessage] = useState('');

  const report = (r: { ok: boolean; message: string }, sound: 'coin' | 'ui' = 'ui') => {
    setMessage(r.message);
    sfx(r.ok ? sound : 'error');
  };

  return (
    <>
      <div className="screen-head">
        <button type="button" className="btn btn-icon" onClick={onBack} aria-label="Back"><ArrowLeft size={16} /> Back</button>
        <h2 className="panel-title">Shop</h2>
        <span className="wallet"><Coins size={16} /> {formatMoney(profile.money)}</span>
      </div>

      <CategoryTabs value={tab} onChange={setTab} />

      <div className="grid" role="tabpanel">
        {tab === 'bait'
          ? BAITS.map((b) => {
              const lock = profile.level < b.unlockLevel ? `Level ${b.unlockLevel}` : null;
              const stock = profile.baitStock[b.id] ?? 0;
              const maxed = b.reusable && stock > 0;
              const poor = profile.money < b.price;
              return (
                <ItemCard
                  key={b.id}
                  name={b.name}
                  description={b.description}
                  stats={[
                    { label: 'Pack', value: b.reusable ? 'Single, reusable' : `${b.packSize} pieces` },
                    { label: 'You have', value: b.reusable ? (stock > 0 ? 'Owned' : 'None') : String(stock) },
                  ]}
                  locked={lock}
                  footer={
                    <>
                      <span className="price"><Coins size={13} /> {b.price}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={!!lock || maxed || poor}
                        onClick={() => report(buyBait(b.id), 'coin')}
                      >
                        {maxed ? 'Owned' : lock ? 'Locked' : poor ? 'Not enough coins' : 'Buy'}
                      </button>
                    </>
                  }
                />
              );
            })
          : itemsOf(tab).map((i) => {
              const owned = profile.owned[i.category].includes(i.id);
              const equipped = profile.equipped[i.category] === i.id;
              const lock = !owned && profile.level < i.unlockLevel ? `Level ${i.unlockLevel}` : null;
              const poor = profile.money < i.price;
              return (
                <ItemCard
                  key={i.id}
                  name={i.name}
                  description={i.description}
                  stats={statLines(i)}
                  badge={equipped ? 'Equipped' : owned ? 'Owned' : undefined}
                  locked={lock}
                  highlight={equipped}
                  footer={
                    owned ? (
                      <button type="button" className="btn btn-sm" disabled={equipped} onClick={() => report(equipItem(i.id))}>
                        {equipped ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <>
                        <span className="price"><Coins size={13} /> {formatMoney(i.price)}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={!!lock || poor}
                          onClick={() => report(buyItem(i.id), 'coin')}
                        >
                          {lock ? 'Locked' : poor ? 'Not enough coins' : 'Buy'}
                        </button>
                      </>
                    )
                  }
                />
              );
            })}
      </div>
      <p className="screen-msg" role="status">{message}</p>
    </>
  );
}
