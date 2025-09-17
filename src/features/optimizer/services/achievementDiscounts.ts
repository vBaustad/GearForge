import type { AchievementId, Crest } from "../types/simc";

const CREST_DISCOUNT_PER_STEP = 5;

const CREST_DISCOUNT_ACHIEVEMENTS: Record<Crest, ReadonlyArray<AchievementId>> = {
  Weathered: [40107, 40942, 41886],
  Carved:    [40115, 40943, 41887],
  Runed:     [40118, 40944, 41888],
  Gilded:    [], // no in-game reduction confirmed for this tier in TWW S3
};

export function crestDiscountsFromAchievements(
  achievements: AchievementId[] | undefined
): Partial<Record<Crest, number>> {
  if (!achievements || achievements.length === 0) return {};

  const owned = new Set<AchievementId>(achievements);
  const out: Partial<Record<Crest, number>> = {};

  for (const crest of Object.keys(CREST_DISCOUNT_ACHIEVEMENTS) as Crest[]) {
    const unlocks = CREST_DISCOUNT_ACHIEVEMENTS[crest];
    if (unlocks.length === 0) continue;
    if (unlocks.some((id) => owned.has(id))) {
      out[crest] = CREST_DISCOUNT_PER_STEP;
    }
  }

  return out;
}

export const __testables = {
  CREST_DISCOUNT_PER_STEP,
  CREST_DISCOUNT_ACHIEVEMENTS,
};
