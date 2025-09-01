// src/features/optimizer/pages/OptimizerResultPage.tsx
import { useMemo } from "react";
import page from "../../../styles/page.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { parseSimc, parseCharacterUpgradeContext } from "../services/simcParser";
import { Paperdoll } from "../components/Paperdoll";
import { PlansSummary } from "../components/PlansSummary";
import { NarrativePlan } from "../components/NarrativePlan";
import type { SimcPayload, ItemState, ParsedItem, Crest } from "../types/simc";
import { decodeFromUrlHash } from "../services/urlCodec";
import { toItemState } from "../services/infer";
import { planAll } from "../services/planner";
import { watermarksToFreeIlvlBySlot } from "../services/slotMap";

export default function OptimizerResultPage() {
  usePageMeta({ /* ... */ });

  const data: SimcPayload | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    return decodeFromUrlHash(window.location.hash);
  }, []);

  const simcText = data?.simc ?? "";

  // --- Parse equipped items ---
  const items: ParsedItem[] = useMemo(
    () => (simcText ? parseSimc(simcText) : []),
    [simcText]
  );

  // --- Parse upgrade context (wallet, watermarks, achievements) ---
  const upgradeCtx = useMemo(
    () => (simcText ? parseCharacterUpgradeContext(simcText) : null),
    [simcText]
  );

  // --- Item states for planner ---
  const itemStates: ItemState[] = useMemo(
    () => items.map(toItemState).filter((x): x is ItemState => !!x),
    [items]
  );

  // --- Natural drop ceiling (Hero r3) ---
  const ceilingIlvl = data?.ceilingIlvl ?? 701;
  const ignoreCeiling = !!data?.ignoreCeiling;

  // --- (Optional) Watermarks -> free ranges (not used by current policy, but harmless) ---
  const freeIlvlBySlot = useMemo(
    () => (upgradeCtx ? watermarksToFreeIlvlBySlot(upgradeCtx.watermarks) : {}),
    [upgradeCtx]
  );
  void freeIlvlBySlot; // quiet linter if unused

  // --- Map wallet currencies -> crest counts for the planner (optional but enables surplus hint) ---
  // NOTE: verify/adjust these IDs for your build if needed.
  const CURRENCY_TO_CREST: Record<number, Crest> = {
    3284: "Weathered",
    3286: "Carved",
    3288: "Runed",
    3290: "Gilded",
    // 3008 is Flightstones — not a Crest; we intentionally ignore it here.
  };

  const crestStock = useMemo(() => {
    const stock: Partial<Record<Crest, number>> = {};
    if (!upgradeCtx) return stock;

    for (const entry of upgradeCtx.wallet) {
      if (entry.kind !== "currency") continue;
      const crest = CURRENCY_TO_CREST[entry.currencyId];
      if (!crest) continue;
      stock[crest] = (stock[crest] ?? 0) + (entry.quantity ?? 0);
    }
    return stock;
  }, [upgradeCtx]);

  // --- Plan ---
  const { plans, totals } = useMemo(
    () =>
      planAll(itemStates, {
        dropCeilingIlvl: ceilingIlvl,
        ignoreCeiling,
        crestStock,       // enables “surplus Runed” informational note
      }),
    [itemStates, ceilingIlvl, ignoreCeiling, crestStock]
  );

  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
  }

  return (
    <main className={page.wrap}>
      <header className={page.header}>
        <div className={page.titleRow}>
          <h1 className={page.title}>Upgrade Planner</h1>
        </div>

        <div className={page.topBar}>
          <div className={page.topLeft} />
          <button className={page.primaryBtn} onClick={copyLink}>
            Copy Link
          </button>
        </div>
      </header>

      <section className={page.results}>
        <header className={page.resultsHeader}>
          <h2>Recommended Upgrades</h2>
        </header>

        {items.length === 0 ? (
          <div className={page.empty}>
            <div className={page.emptyBadge}>No data</div>
            <p className={page.emptyText}>This link doesn’t contain a SimC payload.</p>
          </div>
        ) : (
          <>
            <Paperdoll items={items} plans={plans} />
            <PlansSummary totals={totals} />
            <NarrativePlan plans={plans} ceilingIlvl={ceilingIlvl} />
          </>
        )}
      </section>
    </main>
  );
}
