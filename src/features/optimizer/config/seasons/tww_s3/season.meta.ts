import type { SeasonConfig } from "../../../types/season";

export const meta_tww_s3 = {
  id: "tww-s3",
  defaultDropCeilingIlvl: 701, // natural Hero r3 drop

  currencies: {
    weathered: 3284,
    carved:    3286,
    runed:     3288,
    gilded:    3290,
    flightstones: 3008,
  },

  crestWeeklyIncrement: {
    Weathered: 90, Carved: 90, Runed: 90, Gilded: 90,
  },

  // Set these to your real regional open dates for precise week math
  crestCapStartDateISO: {
    Weathered: "2025-08-06",
    Carved:    "2025-08-06",
    Runed:     "2025-08-13",
    Gilded:    "2025-08-13",
  },

  noCrestUpgradeItemIds: [
    235499, // Reshii Wraps (season cloak)
    245964, // Durable Information Securing Container (old-season belt)
  ],
} satisfies Pick<
  SeasonConfig,
  "id" | "defaultDropCeilingIlvl" | "currencies" |
  "crestWeeklyIncrement" | "crestCapStartDateISO" | "noCrestUpgradeItemIds"
>;
