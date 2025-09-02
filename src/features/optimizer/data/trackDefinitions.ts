import type { Track, TrackKey } from "../types/simc";

/** Track templates WITHOUT ilvl. */
type TrackTemplate = Omit<Track, "ilvlByRank">;

export const trackTemplates: Record<TrackKey, TrackTemplate> = {
  Explorer: {
    key: "Explorer",
    maxRank: 8,
    // Flightstones-only: mark crest steps with cost 0 so they don't count.
    steps: [
      { from: 1, to: 2, crest: "Weathered", cost: 0 },
      { from: 2, to: 3, crest: "Weathered", cost: 0 },
      { from: 3, to: 4, crest: "Weathered", cost: 0 },
      { from: 4, to: 5, crest: "Weathered", cost: 0 },
      { from: 5, to: 6, crest: "Weathered", cost: 0 },
      { from: 6, to: 7, crest: "Weathered", cost: 0 },
      { from: 7, to: 8, crest: "Weathered", cost: 0 },
    ],
  },
  Adventurer: {
    key: "Adventurer",
    maxRank: 8,
    steps: [
      // 1–4 are flightstones-only
      { from: 1, to: 2, crest: "Weathered", cost: 0 },
      { from: 2, to: 3, crest: "Weathered", cost: 0 },
      { from: 3, to: 4, crest: "Weathered", cost: 0 },
      // 4→5 and above cost Weathered
      { from: 4, to: 5, crest: "Weathered", cost: 15 },
      { from: 5, to: 6, crest: "Weathered", cost: 15 },
      { from: 6, to: 7, crest: "Weathered", cost: 15 },
      { from: 7, to: 8, crest: "Weathered", cost: 15 },
    ],
  },
  Veteran: {
    key: "Veteran",
    maxRank: 8,
    steps: [
      { from: 1, to: 2, crest: "Weathered", cost: 15 },
      { from: 2, to: 3, crest: "Weathered", cost: 15 },
      { from: 3, to: 4, crest: "Weathered", cost: 15 },
      { from: 4, to: 5, crest: "Carved",    cost: 15 },
      { from: 5, to: 6, crest: "Carved",    cost: 15 },
      { from: 6, to: 7, crest: "Carved",    cost: 15 },
      { from: 7, to: 8, crest: "Carved",    cost: 15 },
    ],
  },
  Champion: {
    key: "Champion",
    maxRank: 8,
    steps: [
      { from: 1, to: 2, crest: "Carved", cost: 15 },
      { from: 2, to: 3, crest: "Carved", cost: 15 },
      { from: 3, to: 4, crest: "Carved", cost: 15 },
      { from: 4, to: 5, crest: "Runed",  cost: 15 },
      { from: 5, to: 6, crest: "Runed",  cost: 15 },
      { from: 6, to: 7, crest: "Runed",  cost: 15 },
      { from: 7, to: 8, crest: "Runed",  cost: 15 },
    ],
  },
  Hero: {
    key: "Hero",
    maxRank: 6,
    steps: [
      { from: 1, to: 2, crest: "Runed",  cost: 15 },
      { from: 2, to: 3, crest: "Runed",  cost: 15 },
      { from: 3, to: 4, crest: "Runed",  cost: 15 },
      { from: 4, to: 5, crest: "Gilded", cost: 15 },
      { from: 5, to: 6, crest: "Gilded", cost: 15 },
    ],
  },
  Myth: {
    key: "Myth",
    maxRank: 6,
    steps: [
      { from: 1, to: 2, crest: "Gilded", cost: 15 },
      { from: 2, to: 3, crest: "Gilded", cost: 15 },
      { from: 3, to: 4, crest: "Gilded", cost: 15 },
      { from: 4, to: 5, crest: "Gilded", cost: 15 },
      { from: 5, to: 6, crest: "Gilded", cost: 15 },
    ],
  },
};
