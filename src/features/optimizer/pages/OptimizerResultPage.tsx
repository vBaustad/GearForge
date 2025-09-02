// src/features/optimizer/pages/OptimizerResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import page from "../../../styles/page.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { parseSimc, parseCharacterUpgradeContext, parseCharacterMeta } from "../services/simcParser";
import { Paperdoll } from "../components/Paperdoll";
import { NarrativePlan } from "../components/NarrativePlan";
import type { SimcPayload, ItemState, ParsedItem, Crest } from "../types/simc";
import { decodeFromUrlHash } from "../services/urlCodec";
import { toItemState } from "../services/upgradePlanner";
import { planAll } from "../services/planner";
import { watermarksToFreeIlvlBySlot } from "../services/slotMap";
import { RotateCcw, ExternalLink, Copy } from "lucide-react";
import { IconUrlsProvider, type IconUrlMap } from "../context/IconUrlContext";
import { useNavigate } from "react-router-dom";

const CLASS_COLORS: Record<string, string> = {
  death_knight: "#C41E3A",
  demon_hunter: "#A330C9",
  druid: "#FF7C0A",
  evoker: "#33937F",
  hunter: "#AAD372",
  mage: "#3FC7EB",
  monk: "#00FF98",
  paladin: "#F48CBA",
  priest: "#FFFFFF",
  rogue: "#FFF468",
  shaman: "#0070DD",
  warlock: "#8787ED",
  warrior: "#C69B6D",
};

const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "");

const titleCase = (s?: string | null) =>
  s ? s.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()) : "";

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

  // --- Parse upgrade context ---
  const upgradeCtx = useMemo(
    () => (simcText ? parseCharacterUpgradeContext(simcText) : null),
    [simcText]
  );

  // --- Character meta ---
  const meta = useMemo(
    () => (simcText ? parseCharacterMeta(simcText) : null),
    [simcText]
  );

  // Helpers for header display
  const displaySpec = (meta?.spec ?? meta?.headerLineSpec) ?? null;
  const subtitle =
    meta
      ? [
          displaySpec ? cap(displaySpec) : null,
          meta.region ? meta.region.toUpperCase() : null,
          meta.server ? titleCase(meta.server) : null,
        ].filter(Boolean).join(" • ")
      : null;

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

  const classColor = meta?.className ? CLASS_COLORS[meta.className] : undefined;
  const nameStyle: React.CSSProperties = classColor
    ? {
        color: classColor,
        // add a subtle stroke/shadow when the color is very light (e.g., Priest)
        textShadow:
          classColor.toLowerCase() === "#ffffff"
            ? "0 1px 1px rgba(0,0,0,0.5)"
            : "0 1px 0 rgba(0,0,0,0.35)",
      }
    : {};

  return (
    <main className={page.wrap}>
      <header className={page.header}>
        <div className={page.titleRow}>

          {/* H1 = Character name or fallback */}
          <h1 className={page.title} style={nameStyle}>
            {meta?.name ?? "Upgrade Planner"}
          </h1>

          {/* Subtitle = Class • Realm */}
          {meta && (
            <div style={{ marginTop: 2, opacity: 0.85, fontSize: 14 }}>
              {subtitle}
            </div>
          )}
        </div>
      </header>

      <section className={page.results}>
        <header className={page.resultsHeader}>
          <div className={page.resultsHeaderBar}>
            {/* Left: title */}
            <h2>Recommended Upgrades</h2>

            {/* Center: date */}
            {meta?.headerLineTimestamp ? (
              <div className={page.exportStamp}>Exported: {meta.headerLineTimestamp}</div>
            ) : <div />}

            {/* Right: actions */}
            <div className={page.actions}>
              <button
                className={page.primaryBtn}
                onClick={() => navigate("/optimizer")}
                aria-label="Start over and return to the optimizer input page"
              >
                <RotateCcw className={page.btnIcon} />
                Start Over
              </button>

              {meta?.armoryUrl && (
                <a
                  className={page.primaryBtn}
                  href={meta.armoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open character on the official Armory"
                >
                  <ExternalLink className={page.btnIcon} />
                  Armory
                </a>
              )}

              <button className={page.primaryBtn} onClick={copyLink}>
                <Copy className={page.btnIcon} />
                Copy Link
              </button>
            </div>
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
