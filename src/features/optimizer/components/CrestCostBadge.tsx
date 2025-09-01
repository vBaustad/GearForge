// src/features/optimizer/components/CrestCostBadge.tsx
import type { CharacterUpgradeContext, SlotIndex } from "../types/simc";
import { computeCrestsForUpgrade } from "../services/crests";
import { CREST_SCHEDULE } from "../services/schedules"

export function CrestCostBadge({
  slot, startIlvl, targetIlvl, upgradeCtx,
}: {
  slot: SlotIndex;
  startIlvl: number;
  targetIlvl: number;
  upgradeCtx?: CharacterUpgradeContext;
}) {
  if (!upgradeCtx?.watermarks?.length) return <span className="badge">Crests: —</span>;

  const crests = computeCrestsForUpgrade({
    slot,
    startIlvl,
    targetIlvl,
    watermarks: upgradeCtx.watermarks,
    schedule: CREST_SCHEDULE,
  });

  return (
    <span
      className={`badge ${crests === 0 ? "badge-success" : ""}`}
      title={crests === 0 ? "Covered by high-watermark (valorstones still apply)" : "Crests needed (valorstones ignored)"}
    >
      Crests: {crests}
    </span>
  );
}
