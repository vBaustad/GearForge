// src/features/optimizer/services/tracks.ts (or schedules.ts)
import type { CrestStep } from "./crests";
export const CREST_SCHEDULE: CrestStep[] = [
  // TODO: replace with live season values
  { fromIlvl: 600, toIlvl: 800, stepSize: 3, crestsPerStep: 1 },
];
