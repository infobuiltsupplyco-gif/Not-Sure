/**
 * Conservative MET-based exercise energy estimates, following the Compendium
 * of Physical Activities. Burn is always presented as a range and the LOW end
 * is what feeds any calorie-budget math.
 */

export interface Activity {
  slug: string;
  name: string;
  met: number;
  category: string;
}

export const ACTIVITIES: Activity[] = [
  { slug: "walking-casual", name: "Walking, casual (~4 km/h)", met: 3.0, category: "Walking" },
  { slug: "walking-brisk", name: "Walking, brisk (~5.5 km/h)", met: 4.3, category: "Walking" },
  { slug: "hiking", name: "Hiking, trails", met: 6.0, category: "Walking" },
  { slug: "running-8", name: "Running, 8 km/h", met: 8.3, category: "Running" },
  { slug: "running-10", name: "Running, 10 km/h", met: 9.8, category: "Running" },
  { slug: "running-12", name: "Running, 12 km/h", met: 11.5, category: "Running" },
  { slug: "cycling-leisure", name: "Cycling, leisure (~15 km/h)", met: 5.8, category: "Cycling" },
  { slug: "cycling-moderate", name: "Cycling, moderate (~20 km/h)", met: 8.0, category: "Cycling" },
  { slug: "cycling-vigorous", name: "Cycling, vigorous (~25+ km/h)", met: 10.0, category: "Cycling" },
  { slug: "strength-general", name: "Strength training, general", met: 3.5, category: "Gym" },
  { slug: "strength-vigorous", name: "Strength training, vigorous", met: 6.0, category: "Gym" },
  { slug: "hiit", name: "HIIT / circuit training", met: 8.0, category: "Gym" },
  { slug: "elliptical", name: "Elliptical trainer", met: 5.0, category: "Gym" },
  { slug: "rowing-moderate", name: "Rowing machine, moderate", met: 7.0, category: "Gym" },
  { slug: "stair-climber", name: "Stair climber", met: 9.0, category: "Gym" },
  { slug: "swimming-leisure", name: "Swimming, leisure", met: 6.0, category: "Swimming" },
  { slug: "swimming-laps", name: "Swimming laps, moderate", met: 8.3, category: "Swimming" },
  { slug: "yoga", name: "Yoga, hatha", met: 2.5, category: "Mind & body" },
  { slug: "pilates", name: "Pilates", met: 3.0, category: "Mind & body" },
  { slug: "stretching", name: "Stretching / mobility", met: 2.3, category: "Mind & body" },
  { slug: "basketball", name: "Basketball, game", met: 8.0, category: "Sports" },
  { slug: "soccer", name: "Soccer, casual", met: 7.0, category: "Sports" },
  { slug: "tennis", name: "Tennis, singles", met: 8.0, category: "Sports" },
  { slug: "badminton", name: "Badminton, social", met: 5.5, category: "Sports" },
  { slug: "dancing", name: "Dancing, general", met: 5.0, category: "Sports" },
  { slug: "climbing", name: "Rock climbing / bouldering", met: 7.5, category: "Sports" },
  { slug: "martial-arts", name: "Martial arts, moderate", met: 10.3, category: "Sports" },
  { slug: "skating", name: "Skating (roller/ice)", met: 7.0, category: "Sports" },
  { slug: "gardening", name: "Gardening, general", met: 3.8, category: "Everyday" },
  { slug: "housework", name: "Housework, vigorous", met: 3.5, category: "Everyday" },
];

export interface BurnRange {
  low: number;
  high: number;
}

/**
 * kcal = MET × weight(kg) × hours. Published MET values overestimate for most
 * people (they assume a reference metabolism and 100% of the time at
 * intensity), so we show a range of 75%–100% of the equation value and use
 * the LOW end anywhere calories are budgeted.
 */
export function computeBurnRange(
  met: number,
  weightKg: number,
  durationMin: number
): BurnRange {
  const hours = durationMin / 60;
  const raw = met * weightKg * hours;
  return {
    low: Math.round(raw * 0.75),
    high: Math.round(raw),
  };
}

export function findActivity(slug: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.slug === slug);
}
