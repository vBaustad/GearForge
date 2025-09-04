// src/types/crests.ts
export type Crest = "Weathered" | "Carved" | "Runed" | "Gilded";

/** Canonical order (high → low). Safe to reuse anywhere, not UI-specific. */
export const CREST_TIERS: readonly Crest[] = [
  "Gilded",
  "Runed",
  "Carved",
  "Weathered",
] as const;
