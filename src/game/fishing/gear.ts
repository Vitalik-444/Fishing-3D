import { BAIT_BY_ID, type BaitItem } from '../data/baits';
import { EQUIPMENT_BY_ID, type Hook, type Line, type Reel, type Rod } from '../data/equipment';
import type { Profile } from '../../services/persistence';

export interface Gear {
  rod: Rod;
  reel: Reel;
  line: Line;
  hook: Hook;
  bait: BaitItem;
}

export function gearOf(profile: Profile): Gear {
  return {
    rod: EQUIPMENT_BY_ID[profile.equipped.rod] as Rod,
    reel: EQUIPMENT_BY_ID[profile.equipped.reel] as Reel,
    line: EQUIPMENT_BY_ID[profile.equipped.line] as Line,
    hook: EQUIPMENT_BY_ID[profile.equipped.hook] as Hook,
    bait: BAIT_BY_ID[profile.selectedBait],
  };
}

export function baitAvailable(profile: Profile): boolean {
  const bait = BAIT_BY_ID[profile.selectedBait];
  if (!bait) return false;
  return (profile.baitStock[bait.id] ?? 0) > 0;
}
