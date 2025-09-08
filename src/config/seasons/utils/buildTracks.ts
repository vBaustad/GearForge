import type { Track, TrackKey } from "../../../features/optimizer/types/simc";

/**
 * Compose season tracks from templates + ilvlByRank map.
 * Validates rank count by Track.maxRank.
 */
export function buildTracks(
  trackTemplates: Record<TrackKey, Omit<Track, "ilvlByRank">>,
  ilvlByRank: Record<TrackKey, Record<number, number>>
): Record<TrackKey, Track> {
  const entries = (Object.keys(trackTemplates) as TrackKey[]).map((key) => {
    const base = trackTemplates[key];
    const table = ilvlByRank[key];
    if (!table) throw new Error(`Missing ilvlByRank for track: ${key}`);

    const expected = base.maxRank;
    const actual = Object.keys(table).length;
    if (actual !== expected) {
      throw new Error(`ilvl length mismatch for ${key}. Expected ${expected}, got ${actual}`);
    }
    const track: Track = { ...base, ilvlByRank: table };
    return [key, track] as const;
  });

  return Object.fromEntries(entries) as Record<TrackKey, Track>;
}
