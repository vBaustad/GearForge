import { useMemo } from "react";
import { rewardsData } from "../services/rewards";
import type { RewardsViewData } from "../types/rewards";

export function useRewardsData(): RewardsViewData {
  return useMemo(() => rewardsData, []);
}
