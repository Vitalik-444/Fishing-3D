export interface FishingLocation {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  abundance: Record<string, number>;
}

export const LOCATIONS: readonly FishingLocation[] = [
  {
    id: 'quiet_lake',
    name: 'Quiet Lake',
    description: 'A calm freshwater lake with reedy shallows and a deep channel in the middle.',
    unlockLevel: 1,
    abundance: {
      common_carp: 1,
      crucian_carp: 1.1,
      common_roach: 1.2,
      european_perch: 1,
      northern_pike: 0.9,
      common_bream: 1,
      european_catfish: 0.8,
      grass_carp: 0.9,
    },
  },
];

export const CURRENT_LOCATION: FishingLocation = LOCATIONS[0];
