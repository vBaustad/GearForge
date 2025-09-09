// src/config/seasons/the_war_within/season_3/season.meta.ts
import type { SeasonConfig } from "../../../../types/season";

export const SEASON_NUMBER = 3 as const;
export const SEASON_ID = "tww-s3" as const; // stable slug used across the app

export const seasonMeta = {
  id: SEASON_ID,
  name: "The War Within — Season 3", 
  defaultDropCeilingIlvl: 701,

  currencies: {
    weathered: 3284,
    carved:    3286,
    runed:     3288,
    gilded:    3290,
    flightstones: 3008,
  },

  crestWeeklyIncrement: { Weathered: 90, Carved: 90, Runed: 90, Gilded: 90 },

  crestCapStartDateISO: {
    Weathered: "2025-08-06",
    Carved:    "2025-08-06",
    Runed:     "2025-08-13",
    Gilded:    "2025-08-13",
  },

  progression: {
    sparks:   { startISO: "2025-07-23", ratePerWeek: 0.5 },
    catalyst: { startISO: "2025-07-30", cadenceWeeks: 2 },
  },

  noCrestUpgradeItemIds: [235499, 245964],
} satisfies Pick<
  SeasonConfig,
  | "id"
  | "name"
  | "defaultDropCeilingIlvl"
  | "currencies"
  | "crestWeeklyIncrement"
  | "crestCapStartDateISO"
  | "noCrestUpgradeItemIds"
  | "progression"
>;
