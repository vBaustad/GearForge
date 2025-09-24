// src/features/optimizer/pages/OptimizerResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import page from "../../../styles/page.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { parseSimc, parseCharacterUpgradeContext, parseCharacterMeta } from "../services/simcParser";
import { Paperdoll } from "../components/Paperdoll";
import { NarrativePlan } from "../components/NarrativePlan";
import type { SimcPayload, ItemState, ParsedItem, Crest, ItemPlan, SlotKey } from "../types/simc";
import { buildShareUrl, decodeFromUrlHash } from "../services/urlCodec";
import { toItemState } from "../services/upgradePlanner";
import { planAll } from "../services/planner";
import { normalizeSlot } from "../services/slotMap";
import { RotateCcw, ExternalLink, Copy } from "lucide-react";
import { IconUrlsProvider, type IconUrlMap } from "../context/IconUrlContext";
import { useNavigate, useMatches, type UIMatch } from "react-router-dom";
import PageSplashGate from "../components/PageSplashGate";
import orp from "./optimizerResultPage.module.css";
import GoogleAd from "../../../components/ads/GoogleAd";
import { AD_SLOTS } from "../../../config/ads";

// Local: UI rarity set we style for
type DisplayRarity = "poor" | "common" | "uncommon" | "rare" | "epic" | "legendary";

/* ──────────────────────────────────────────────────────────────
   Ad gating helper (respects route handles)
────────────────────────────────────────────────────────────── */
type RouteHandle = { noAds?: boolean };
function useAllowAds() {
  const matches = useMatches() as UIMatch<RouteHandle>[];
  const noAdsFromHandle = matches.some(m => (m.handle as RouteHandle)?.noAds);
  return !noAdsFromHandle;
}

/* ──────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */

// Prefer SimC quality info over nothing (while meta is loading)
function extractFallbackRarityText(it?: ParsedItem): string | undefined {
  if (!it) return undefined;
  const f = it as unknown as { rarity?: unknown; qualityText?: unknown; qualityName?: unknown };
  return (
    (typeof f.rarity === "string" && f.rarity) ||
    (typeof f.qualityText === "string" && f.qualityText) ||
    (typeof f.qualityName === "string" && f.qualityName) ||
    undefined
  );
}
function extractFallbackRarityNum(it?: ParsedItem): number | undefined {
  if (!it) return undefined;
  const f = it as unknown as { quality?: unknown; itemQuality?: unknown; qualityId?: unknown };
  return (
    (typeof f.quality === "number" && f.quality) ||
    (typeof f.itemQuality === "number" && f.itemQuality) ||
    (typeof f.qualityId === "number" && f.qualityId) ||
    undefined
  );
}

// Map loose strings / SimC numeric qualities to our DisplayRarity
function coerceDisplayRarity(
  primary?: string, // keep signature (unused here), stays for future flexibility
  fallbackText?: string, // e.g. "Epic"
  fallbackNum?: number // 0..7
): DisplayRarity | undefined {
  const fromStr = (s?: string): DisplayRarity | undefined => {
    if (!s) return;
    const t = s.toLowerCase();
    if (t === "poor" || t === "common" || t === "uncommon" || t === "rare" || t === "epic" || t === "legendary") {
      return t as DisplayRarity;
    }
    if (t === "artifact" || t === "heirloom") return "legendary";
    return undefined;
  };
  const fromNum = (n?: number): DisplayRarity | undefined => {
    switch (n) {
      case 0:
        return "poor";
      case 1:
        return "common";
      case 2:
        return "uncommon";
      case 3:
        return "rare";
      case 4:
        return "epic";
      case 5:
        return "legendary";
      case 6: // artifact
      case 7: // heirloom
        return "legendary";
      default:
        return undefined;
    }
  };
  return fromStr(primary) ?? fromStr(fallbackText) ?? fromNum(fallbackNum);
}

// SimC currency → crest tier
const CURRENCY_TO_CREST: Record<number, Crest> = {
  3284: "Weathered",
  3286: "Carved",
  3288: "Runed",
  3290: "Gilded",
};

// small helpers
const isFiniteNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const titleCase = (s?: string | null) =>
  s ? s.replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()) : "";

// Extract ilvl from either .ilvl or .level (ignore <=0)
const getIlvl = (x: { ilvl?: number; level?: number } | undefined | null): number | null => {
  if (!x) return null;
  const v = isFiniteNum(x.ilvl) ? x.ilvl : isFiniteNum(x.level) ? x.level : null;
  return v && v > 0 ? v : null;
};

type ItemBySlot = Partial<Record<SlotKey, ParsedItem>>;
type PlanBySlot = Partial<Record<SlotKey, ItemPlan>>;

function buildItemMap(items: ParsedItem[]): ItemBySlot {
  const map: ItemBySlot = {};
  for (const it of items) {
    const s = normalizeSlot(it.slot);
    if (s) map[s] = it;
  }
  return map;
}
function buildPlanMap(plans?: ItemPlan[]): PlanBySlot {
  const map: PlanBySlot = {};
  for (const p of plans ?? []) map[p.slot] = p;
  return map;
}

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */

export default function OptimizerResultPage() {
  usePageMeta({
    title: "Upgrade Planner",
    description:
      "Plan your WoW upgrades from a SimC export. See crest costs and the fastest, most crest-efficient path to higher item level.",
    canonical: "/optimizer",
    image: "/og/optimizer.png",
    ogType: "website",
  });

  const allowAds = useAllowAds();

  const data: SimcPayload | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const byHash = decodeFromUrlHash(window.location.hash);
    if (byHash) return byHash;
    const byQuery = decodeFromUrlHash(window.location.search);
    if (byQuery) return byQuery;
    return null;
  }, []);

  const simcText = data?.simc ?? "";

  // --- Parse equipped items ---
  const items: ParsedItem[] = useMemo(() => (simcText ? parseSimc(simcText) : []), [simcText]);

  // --- Parse upgrade context ---
  const upgradeCtx = useMemo(() => (simcText ? parseCharacterUpgradeContext(simcText) : null), [simcText]);

  // --- Character meta ---
  const meta = useMemo(() => (simcText ? parseCharacterMeta(simcText) : null), [simcText]);

  // Header bits
  const displaySpec = (meta?.spec ?? meta?.headerLineSpec) ?? null;
  const subtitle = meta
    ? [displaySpec ? cap(displaySpec) : null, meta.region ? meta.region.toUpperCase() : null, meta.server ? titleCase(meta.server) : null]
        .filter(Boolean)
        .join(" - ")
    : null;

  // --- Planner inputs ---
  const itemStates: ItemState[] = useMemo(() => items.map(toItemState).filter((x): x is ItemState => !!x), [items]);

  const ceilingIlvl = data?.ceilingIlvl ?? 701;
  const ignoreCeiling = !!data?.ignoreCeiling;

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

  const { plans } = useMemo(
    () =>
      planAll(itemStates, {
        dropCeilingIlvl: ceilingIlvl,
        ignoreCeiling,
        crestStock,
        watermarks: upgradeCtx?.watermarks,
        achievements: upgradeCtx?.achievements,
      }),
    [itemStates, ceilingIlvl, ignoreCeiling, crestStock, upgradeCtx]
  );

  function copyLink() {
    if (typeof window === "undefined") return;
    const current: SimcPayload | null = data ?? (simcText ? { simc: simcText, ceilingIlvl, ignoreCeiling } : null);
    if (!current) {
      navigator.clipboard.writeText(window.location.href);
      return;
    }
    const url = buildShareUrl(current);
    navigator.clipboard.writeText(url);
    window.history.replaceState(null, "", url);
  }

  // Collect icon IDs to prefetch
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

  // Kept from earlier code; harmless if not used elsewhere
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
  const classToken = meta?.className ? (page as Record<string, string>)[`class-${meta.className}`] ?? "" : "";

  // =========================
  // Current vs potential avg ilvl (same rule as Paperdoll)
  // =========================
  const bySlot = useMemo(() => buildItemMap(items), [items]);
  const planMap = useMemo(() => buildPlanMap(plans), [plans]);

  const currentAvgIlvl = useMemo(() => {
    const vals: number[] = [];
    for (const slot in bySlot) {
      const key = slot as SlotKey;
      const v = getIlvl(bySlot[key]);
      if (isFiniteNum(v) && v > 0) vals.push(v);
    }
    return Math.round(avg(vals));
  }, [bySlot]);

  const potentialAvgIlvl = useMemo(() => {
    const vals: number[] = [];
    const slots = Object.keys(bySlot) as SlotKey[];
    for (const slot of slots) {
      const item = bySlot[slot];
      const plan = planMap[slot];
      const current = getIlvl(item);
      if (!isFiniteNum(current) || current <= 0) continue;

      const hasUpgrade = !!plan && isFiniteNum(plan.toRank) && isFiniteNum(plan.fromRank) && plan.toRank > plan.fromRank;

      const display = hasUpgrade && isFiniteNum(plan?.toIlvl) && plan!.toIlvl > 0 ? plan!.toIlvl : current;

      vals.push(display);
    }
    return Math.round(avg(vals));
  }, [bySlot, planMap]);

  const ilvlDelta = (potentialAvgIlvl ?? 0) - (currentAvgIlvl ?? 0);

  // =========================
  // Visuals for NarrativePlan — Icons (prefetched) + rarity from SimC fallback
  // =========================

  const visualsBySlot = useMemo(() => {
    const choose = (slot: SlotKey): DisplayRarity => {
      const it = bySlot[slot];
      const text = extractFallbackRarityText(it);
      const num = extractFallbackRarityNum(it);
      return coerceDisplayRarity(undefined, text, num) ?? "epic";
    };

    const v: Partial<Record<SlotKey, { icon?: string; rarity?: DisplayRarity; label?: string }>> = {};
    const slots: SlotKey[] = [
      "head",
      "neck",
      "shoulder",
      "back",
      "chest",
      "wrist",
      "hands",
      "waist",
      "legs",
      "feet",
      "finger1",
      "finger2",
      "trinket1",
      "trinket2",
      "main_hand",
      "off_hand",
    ];

    for (const slot of slots) {
      const it = bySlot[slot];
      if (!it) continue;
      const icon = typeof it.id === "number" ? iconMap[it.id] : undefined;
      const rarity = choose(slot);
      v[slot] = { icon, rarity, label: it.name };
    }
    return v;
  }, [bySlot, iconMap]);

  return (
    <PageSplashGate durationMs={2000} oncePerSession={false} storageKey="gf-opt-splash-seen">
      <main className={`${page.wrap} ${page.wrapWide}`}>
        {/* ONE continuous panel (mast + ad + results) */}
        <section aria-label="Upgrade results" className={orp.board}>
          <div className={orp.boardBody}>
            {/* Mast section */}
            <div className={orp.section}>
              <header className={`${page.mast} ${classToken}`}>
                <h1 className={page.mastName}>{meta?.name ?? "Upgrade Planner"}</h1>
                {meta && <div className={page.mastSubline}>{subtitle}</div>}

                <div className={`${page.mastKpis} ${page.kpiRow}`} aria-live="polite">
                  <div className={page.kpiPill} title="Average of equipped items">
                    <span className={page.kpiLabel}>Current ilvl</span>
                    <strong className={page.kpiValue}>{currentAvgIlvl || "—"}</strong>
                  </div>

                  <div
                    className={[
                      page.kpiPill,
                      ilvlDelta > 0 ? page.kpiUp : "",
                      ilvlDelta < 0 ? page.kpiDown : "",
                    ].join(" ")}
                    title="If you apply the recommended upgrades"
                  >
                    <span className={page.kpiLabel}>Potential ilvl</span>
                    <strong className={page.kpiValue}>{potentialAvgIlvl || "—"}</strong>
                    {ilvlDelta !== 0 && <span className={page.kpiDelta}>{ilvlDelta > 0 ? "+" : ""}{ilvlDelta}</span>}
                  </div>
                </div>
              </header>
            </div>

            {/* Ad section */}
            <div className={orp.sectionAd}>
              <div className={orp.adFrame}>
                <GoogleAd
                  enabled={allowAds}
                  slot={AD_SLOTS.optimizerResultHeader}
                  style={{ minHeight: 120 }}
                  placeholderLabel="Results header"
                />
              </div>
            </div>

            {/* Results card inside the board */}
            <div className={orp.section}>
              <div className={orp.innerCard}>
                <header className={page.resultsHeader}>
                  <div className={page.resultsHeaderBar}>
                    <h2>Recommended Upgrades</h2>
                    {meta?.headerLineTimestamp ? (
                      <div className={page.exportStamp}>Exported: {meta.headerLineTimestamp}</div>
                    ) : (
                      <div />
                    )}
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
                  <IconUrlsProvider urls={iconMap}>
                    <Paperdoll items={items} plans={plans} />

                    <div style={{ margin: "24px auto", width: "100%", maxWidth: 760 }}>
                      <GoogleAd
                        enabled={allowAds}
                        slot={AD_SLOTS.optimizerResultInline}
                        style={{ minHeight: 250 }}
                        placeholderLabel="Results inline"
                      />
                    </div>

                    <NarrativePlan plans={plans} ceilingIlvl={ceilingIlvl} visualsBySlot={visualsBySlot} />
                  </IconUrlsProvider>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageSplashGate>
  );
}
