export const formatWeight = (kg: number): string => `${kg.toFixed(kg < 10 ? 2 : 1)} kg`;
export const formatLength = (cm: number): string => `${Math.round(cm)} cm`;
export const formatMoney = (n: number): string => n.toLocaleString('en-US');

export function timeAgo(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}
