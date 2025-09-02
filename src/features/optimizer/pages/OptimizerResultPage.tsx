// src/features/optimizer/pages/OptimizerResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import page from "../../../styles/page.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { parseSimc, parseCharacterUpgradeContext } from "../services/simcParser";
import { Paperdoll } from "../components/Paperdoll";
import { NarrativePlan } from "../components/NarrativePlan";
import type { SimcPayload, ItemState, ParsedItem, Crest } from "../types/simc";
import { decodeFromUrlHash } from "../services/urlCodec";
import { toItemState } from "../services/upgradePlanner";
import { planAll } from "../services/planner";
import { watermarksToFreeIlvlBySlot } from "../services/slotMap";

import { IconUrlsProvider, type IconUrlMap } from "../context/IconUrlContext";
import { useNavigate } from "react-router-dom";

export default function OptimizerResultPage() {
  usePageMeta({
    title: "GearForge — Optimize Your Gear",
    description:
      "Paste your SimC (or export) to analyze upgrades, compare slots, and get fast, clear recommendations.",
    ogTitle: "GearForge",
    ogDescription: "Forge the perfect setup.",
    ogImage: "/images/og/gearforge-wide-dark.png",
    canonical: typeof window !== "undefined" ? window.location.href : "https://gearforge.app",
  });

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

  // --- (Optional) Watermarks -> free ranges ---
  const freeIlvlBySlot = useMemo(
    () => (upgradeCtx ? watermarksToFreeIlvlBySlot(upgradeCtx.watermarks) : {}),
    [upgradeCtx]
  );
  void freeIlvlBySlot;

  // --- Wallet → crest counts (optional) ---
  const CURRENCY_TO_CREST: Record<number, Crest> = {
    3284: "Weathered",
    3286: "Carved",
    3288: "Runed",
    3290: "Gilded",
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
  const { plans } = useMemo(
    () =>
      planAll(itemStates, {
        dropCeilingIlvl: ceilingIlvl,
        ignoreCeiling,
        crestStock,
      }),
    [itemStates, ceilingIlvl, ignoreCeiling, crestStock]
  );

  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
  }

  // Collect icon IDs you’ll show: equipped + a few planned upgrade items
  const equippedIds = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((it) => (typeof it.id === "number" && Number.isFinite(it.id) ? it.id : null))
            .filter((n): n is number => n !== null)
        )
      ),
    [items]
  );

  const plannedUpgradeIds = useMemo(() => {
    const out: number[] = [];
    const LIMIT = 12;
    if (Array.isArray(plans)) {
      for (const p of plans) {
        if (out.length >= LIMIT) break;
        const upgrades = (p as { upgrades?: unknown }).upgrades;
        if (!Array.isArray(upgrades)) continue;
        for (const up of upgrades) {
          if (out.length >= LIMIT) break;
          if (!up || typeof up !== "object") continue;
          const item = (up as { item?: unknown }).item ?? up;
          if (!item || typeof item !== "object") continue;
          const id = (item as Record<string, unknown>).id;
          if (typeof id === "number" && Number.isFinite(id) && !out.includes(id)) {
            out.push(id);
          }
        }
      }
    }
    return out;
  }, [plans]);

  const allIconIds = useMemo(() => {
    const s = new Set<number>();
    for (const id of equippedIds) s.add(id);
    for (const id of plannedUpgradeIds) s.add(id);
    return Array.from(s);
  }, [equippedIds, plannedUpgradeIds]);

  // Stage 1: FETCH icon URLs once for all IDs
  const [iconMap, setIconMap] = useState<IconUrlMap>({});
  const fetchTotal = allIconIds.length;

  useEffect(() => {
    let canceled = false;
    setIconMap({});

    if (fetchTotal === 0) return;

    (async () => {
      const pairs: Array<[number, string]> = [];
      await Promise.all(
        allIconIds.map(async (id) => {
          try {
            const r = await fetch(`/api/wow/item/${id}/icon`);
            const j = (await r.json()) as { iconUrl?: string };
            pairs.push([id, j.iconUrl || ""]);
          } catch {
            pairs.push([id, ""]);
          }
        })
      );
      if (canceled) return;
      setIconMap(Object.fromEntries(pairs));
    })();

    return () => {
      canceled = true;
    };
  }, [fetchTotal, allIconIds]);

  const navigate = useNavigate();

  return (
    <main className={page.wrap}>
      <header className={page.header}>
        <div className={page.titleRow}>
          <h1 className={page.title}>Upgrade Planner</h1>
        </div>
      </header>

      <section className={page.results}>
        <header className={page.resultsHeader}>
          <h2>Recommended Upgrades</h2>
          <div className={page.topBar}>
            <div className={page.topLeft} />
            <button className={page.primaryBtn} 
              onClick={() => navigate("/optimizer")}
              aria-label="Start over and return to the optimizer input page"
              >
              ↺ Start Over
            </button>
            <button className={page.primaryBtn} onClick={copyLink}>
              Copy Link
            </button>
          </div>
        </header>

        {items.length === 0 ? (
          <div className={page.empty}>
            <div className={page.emptyBadge}>No data</div>
            <p className={page.emptyText}>This link doesn’t contain a SimC payload.</p>
          </div>
        ) : (
          <>     
            <IconUrlsProvider urls={iconMap}>
              <Paperdoll items={items} plans={plans} />
              <NarrativePlan plans={plans} ceilingIlvl={ceilingIlvl} />
            </IconUrlsProvider>
          </>
        )}
      </section>
    </main>
  );
}
