export type TrackId =
  | "explorer"
  | "adventurer"
  | "veteran"
  | "champion"
  | "hero"
  | "myth"


export interface TrackDefinition {
  id: TrackId;
  slug: string;
  label: string;
  maxRank: number;
}

export interface TrackConfig extends TrackDefinition {
  ilvlByRank: number[];
}
