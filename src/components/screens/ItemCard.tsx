import { Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

interface Stat { label: string; value: string }

interface Props {
  name: string;
  description: string;
  stats: Stat[];
  badge?: string;
  locked?: string | null;
  highlight?: boolean;
  footer: ReactNode;
}

export function ItemCard({ name, description, stats, badge, locked, highlight, footer }: Props) {
  return (
    <article className={`item${locked ? ' item-locked' : ''}${highlight ? ' item-on' : ''}`}>
      <header className="item-head">
        <h3 className="item-name">{name}</h3>
        {badge && !locked && <span className="item-badge"><Check size={12} /> {badge}</span>}
        {locked && <span className="item-badge item-badge-lock"><Lock size={12} /> {locked}</span>}
      </header>
      <p className="item-desc">{description}</p>
      <dl className="item-stats">
        {stats.map((s) => (
          <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
        ))}
      </dl>
      <footer className="item-foot">{footer}</footer>
    </article>
  );
}
