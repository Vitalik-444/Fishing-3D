import { CATEGORY_LABEL, EQUIPMENT_CATEGORIES, type EquipmentCategory } from '../../game/data/equipment';
import { sfx } from '../../services/audio';

export type Tab = EquipmentCategory | 'bait';

export const TABS: { id: Tab; label: string }[] = [
  ...EQUIPMENT_CATEGORIES.map((c) => ({ id: c as Tab, label: CATEGORY_LABEL[c] })),
  { id: 'bait', label: 'Baits' },
];

export function CategoryTabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="tabs" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={value === t.id ? 'tab tab-on' : 'tab'}
          onClick={() => {
            sfx('ui');
            onChange(t.id);
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
