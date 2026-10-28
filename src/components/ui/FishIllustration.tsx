import { useId } from 'react';
import type { FishVisual } from '../../game/data/fishSpecies';

interface Props {
  visual: FishVisual;
  silhouette?: boolean;
  className?: string;
}

export function FishIllustration({ visual, silhouette = false, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const h = 20 * visual.bodyRatio;
  const top = 50 - h;
  const bottom = 50 + h;
  const pike = visual.pattern === 'pike';
  const catfish = visual.pattern === 'barbels';
  const headX = pike ? 182 : 172;
  const tailX = 30;

  const body = `M ${tailX} 50 C ${tailX + 34} ${top - 2} ${headX - 52} ${top} ${headX} ${pike ? 47 : 50} C ${headX - 52} ${bottom} ${tailX + 34} ${bottom + 2} ${tailX} 50 Z`;
  const tail =
    visual.tail === 'forked'
      ? `M ${tailX + 4} 50 L 6 ${50 - h * 0.95} Q 18 50 6 ${50 + h * 0.95} Z`
      : `M ${tailX + 4} 50 C 4 ${50 - h * 0.9} 4 ${50 + h * 0.9} ${tailX + 4} 50 Z`;
  const dorsalStart = pike ? 58 : 76;
  const dorsalEnd = pike ? 92 : catfish ? 150 : 124;
  const dorsal = catfish
    ? `M ${dorsalStart + 50} ${top + 3} Q ${dorsalStart + 70} ${top - 6} ${dorsalEnd} ${top + 4} Z`
    : `M ${dorsalStart} ${top + 2} Q ${(dorsalStart + dorsalEnd) / 2} ${top - 17} ${dorsalEnd} ${top + 4} Z`;
  const anal = catfish
    ? `M 48 ${bottom - 3} Q 100 ${bottom + 10} 150 ${bottom - 2} Z`
    : `M ${pike ? 62 : 70} ${bottom - 2} Q ${pike ? 76 : 86} ${bottom + 12} ${pike ? 96 : 108} ${bottom - 3} Z`;
  const pectoral = `M 124 ${50 + h * 0.45} Q 112 ${50 + h * 0.95} 100 ${50 + h * 0.8} Q 112 ${50 + h * 0.4} 124 ${50 + h * 0.45} Z`;

  const fill = silhouette ? '#1d2a25' : `url(#body-${uid})`;
  const fin = silhouette ? '#1d2a25' : visual.fin;

  return (
    <svg viewBox="0 0 200 100" className={className} role="img" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={visual.body} />
          <stop offset="0.58" stopColor={visual.body} />
          <stop offset="1" stopColor={visual.belly} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={body} />
        </clipPath>
      </defs>

      <path d={tail} fill={fin} />
      <path d={dorsal} fill={fin} />
      <path d={anal} fill={fin} />
      <path d={body} fill={fill} />

      {!silhouette && (
        <g clipPath={`url(#clip-${uid})`}>
          {visual.pattern === 'stripes' &&
            [70, 86, 102, 118, 134].map((x) => (
              <path key={x} d={`M ${x} ${top - 2} L ${x + 8} 52 L ${x + 2} ${bottom + 2} L ${x - 6} 52 Z`} fill={visual.accent} opacity="0.75" />
            ))}
          {visual.pattern === 'pike' &&
            [62, 80, 98, 116, 134, 152].map((x, i) => (
              <ellipse key={x} cx={x} cy={46 + (i % 2) * 5} rx="5" ry="2.6" fill={visual.accent} opacity="0.85" />
            ))}
          {visual.pattern === 'spots' &&
            [64, 92, 118, 142].map((x, i) => <circle key={x} cx={x} cy={42 + (i % 2) * 8} r="3" fill={visual.accent} opacity="0.7" />)}
          {catfish && <path d={`M ${tailX} 50 L ${headX} 50`} stroke={visual.accent} strokeWidth="1.5" opacity="0.3" />}
          {!catfish && visual.pattern !== 'stripes' && (
            <path d={`M ${tailX + 6} 50 Q 100 ${50 - h * 0.15} ${headX - 8} 50`} stroke="#ffffff" strokeWidth="2.2" opacity="0.28" fill="none" />
          )}
        </g>
      )}

      <path d={pectoral} fill={fin} opacity={silhouette ? 1 : 0.9} />

      {catfish && (
        <g stroke={silhouette ? '#1d2a25' : visual.accent} strokeWidth="2" strokeLinecap="round" fill="none">
          <path d={`M ${headX - 4} 46 Q ${headX + 14} 40 ${headX + 20} 52`} />
          <path d={`M ${headX - 4} 54 Q ${headX + 14} 62 ${headX + 18} 70`} />
          <path d={`M ${headX - 12} 58 Q ${headX - 4} 72 ${headX - 14} 80`} />
        </g>
      )}

      {!silhouette && (
        <>
          <circle cx={headX - 20} cy={pike ? 44 : 44 - (visual.bodyRatio - 1) * 4} r="3.6" fill="#f4efe0" />
          <circle cx={headX - 19} cy={pike ? 44 : 44 - (visual.bodyRatio - 1) * 4} r="1.9" fill="#101614" />
          <path d={`M ${headX - 7} ${pike ? 50 : 52} Q ${headX - 2} 54 ${headX + 1} 52`} stroke="#101614" strokeWidth="1.2" fill="none" opacity="0.7" />
        </>
      )}
    </svg>
  );
}
