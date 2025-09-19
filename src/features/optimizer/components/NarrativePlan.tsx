import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./components.module.css";
import type { Crest, ItemPlan, SlotKey } from "../types/simc";

// matches what OptimizerResultPage builds:
type DisplayRarity = "poor" | "common" | "uncommon" | "rare" | "epic" | "legendary";
type Visuals = { icon?: string; rarity?: DisplayRarity; label?: string };
type VisualsBySlot = Partial<Record<SlotKey, Visuals>>;

export function NarrativePlan({
  plans,
  ceilingIlvl,
  visualsBySlot,
}: {
  plans?: ItemPlan[];
  ceilingIlvl: number;
  visualsBySlot: VisualsBySlot;
}) {
  const [tab, setTab] = useState<"recommended" | "whyNot">("recommended");

  // Real upgrades only (rank goes up)
  const recommendedPlans = useMemo(
    () =>
      (plans ?? []).filter(
        (p) =>
          typeof p?.fromRank === "number" &&
          typeof p?.toRank === "number" &&
          p.toRank > p.fromRank
      ),
    [plans]
  );

  // Not recommended = everything else
  const whyNotPlans = useMemo(
    () =>
      (plans ?? [])
        .filter(
          (p) =>
            !(
              typeof p?.fromRank === "number" &&
              typeof p?.toRank === "number" &&
              p.toRank > p.fromRank
            )
        )
        .map((p) => ({ plan: p, reason: inferWhyNotReason(p, ceilingIlvl) })),
    [plans, ceilingIlvl]
  );

  // Totals from recommended only
  const crestTotals = useMemo(() => {
    const out: Partial<Record<Crest, number>> = {};
    for (const p of recommendedPlans) {
      for (const [crest, n] of Object.entries(p.crestTotals ?? {})) {
        const key = crest as Crest;
        const val = typeof n === "number" ? n : 0;
        out[key] = (out[key] ?? 0) + val;
      }
    }
    return out;
  }, [recommendedPlans]);

  const totalIlvlGain = useMemo(
    () =>
      recommendedPlans.reduce((sum, p) => {
        const a = numberOr(p.fromIlvl, 0);
        const b = numberOr(p.toIlvl, 0);
        return sum + Math.max(0, b - a);
      }, 0),
    [recommendedPlans]
  );

  return (
    <section className={styles.wrap} aria-label="Upgrade narrative">
      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Upgrade views">
        <button
          role="tab"
          aria-selected={tab === "recommended"}
          className={`${styles.tabBtn} ${tab === "recommended" ? styles.tabActive : ""}`}
          onClick={() => setTab("recommended")}
        >
          Recommended upgrades
        </button>
        <button
          role="tab"
          aria-selected={tab === "whyNot"}
          className={`${styles.tabBtn} ${tab === "whyNot" ? styles.tabActive : ""}`}
          onClick={() => setTab("whyNot")}
        >
          Why not
        </button>

        {/* Right-side pills: global crest totals + ceiling */}
        <div className={styles.rightPills}>
          <div className={styles.upgradePill} title="Total ilvl gained if you apply all recommended upgrades">
            <span className={styles.upgradeDelta}>+{totalIlvlGain || 0} ilvl</span>
          </div>
          {Object.entries(crestTotals)
            .filter(([, v]) => (v ?? 0) > 0)
            .map(([k, v]) => (
              <div key={k} className={styles.upgradePillSecondary} title="Crest totals across recommended upgrades">
                <span>{k}</span>
                <ArrowRight size={14} strokeWidth={2} aria-hidden />
                <span>{v}</span>
              </div>
            ))}
          <div className={styles.ilvlPill} title="Planner ceiling">
            <span className={styles.upgradeDelta}>Ceiling {ceilingIlvl}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {tab === "recommended" ? (
        <RecommendedList plans={recommendedPlans} visualsBySlot={visualsBySlot} />
      ) : (
        <WhyNotList items={whyNotPlans} visualsBySlot={visualsBySlot} />
      )}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   Recommended list
────────────────────────────────────────────────────────────── */

function RecommendedList({
  plans,
  visualsBySlot,
}: {
  plans: ItemPlan[];
  visualsBySlot: VisualsBySlot;
}) {
  if (!plans?.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.badge}>No upgrades</div>
        <p className={styles.emptyText}>Your current setup has no recommended upgrades.</p>
      </div>
    );
  }

  return (
    <ol className={styles.list} role="list">
      {plans.map((p, idx) => (
        <RecRow key={`${p.slot}-${idx}`} plan={p} visuals={visualsBySlot[p.slot]} index={idx} />
      ))}
    </ol>
  );
}

function RecRow({
  plan,
  visuals,
  index,
}: {
  plan: ItemPlan;
  visuals?: Visuals;
  index: number;
}) {
  const fromIlvl = isFiniteNumber(plan.fromIlvl) ? plan.fromIlvl : undefined;
  const toIlvl = isFiniteNumber(plan.toIlvl) ? plan.toIlvl : undefined;

  // e.g. "6 Weathered · 4 Runed"
  const crestText = useMemo(() => {
    const entries = Object.entries(plan.crestTotals ?? {}) as [Crest, number][];
    return entries
      .filter(([, n]) => (n ?? 0) > 0)
      .map(([k, n]) => `${n} ${k}`)
      .join(" · ");
  }, [plan.crestTotals]);

  return (
    <li className={styles.row} data-rarity={visuals?.rarity}>
      {/* main */}
      <div className={styles.main}>
        <div className={styles.iconWrap}>
          <img
            src={visuals?.icon || "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}
            alt={visuals?.label || "Item"}
            width={40}
            height={40}
            className={styles.icon}
          />
        </div>

        <div className={styles.body}>
          <div className={styles.titleRow}>
            <div className={styles.slotName} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={styles.stepIndex}>{index + 1}.</span>
              <strong className={styles.itemTitle}>{visuals?.label || "Unknown item"}</strong>
            </div>
          </div>

          <div className={styles.deltaRow}>
            <span className={styles.deltaKind}>ilvl</span>
            <span className={styles.deltaNum}>{fromIlvl ?? "—"}</span>
            <ArrowRight size={16} strokeWidth={2} className={styles.deltaArrow} aria-hidden />
            <span className={styles.deltaNum}>{toIlvl ?? "—"}</span>

            <span className={styles.rankChip} title="Rank upgrade">
              Rank {plan.fromRank} → {plan.toRank}
            </span>
          </div>
        </div>
      </div>

      {/* right-side: ilvl result + crest cost */}
      <div className={styles.right}>
        <div className={styles.pillsRow}>
          <div className={styles.upgradePill} title="ilvl after applying this upgrade">
            <span className={styles.upgradeDelta}>
              {typeof toIlvl === "number" ? `ilvl ${toIlvl}` : "ilvl —"}
            </span>
          </div>
          {crestText ? (
            <div className={styles.crestPill} title="Crest cost for this upgrade">
              {crestText}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────
   "Why not" list
────────────────────────────────────────────────────────────── */

type WhyNotItem = { plan: ItemPlan; reason: string };

function WhyNotList({
  items,
  visualsBySlot,
}: {
  items: WhyNotItem[];
  visualsBySlot: VisualsBySlot;
}) {
  if (!items?.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.badge}>All set</div>
        <p className={styles.emptyText}>Every slot is either upgraded or already optimal at the moment.</p>
      </div>
    );
  }

  return (
    <ol className={styles.list} role="list">
      {items.map(({ plan, reason }, idx) => (
        <WhyNotRow
          key={`${plan.slot}-${idx}`}
          plan={plan}
          visuals={visualsBySlot[plan.slot]}
          reason={reason}
        />
      ))}
    </ol>
  );
}

function WhyNotRow({
  plan,
  visuals,
  reason,
}: {
  plan: ItemPlan;
  visuals?: Visuals;
  reason: string;
}) {
  const ilvl = isFiniteNumber(plan.fromIlvl) ? plan.fromIlvl : undefined;

  return (
    <li className={styles.row} data-rarity={visuals?.rarity}>
      <div className={styles.main}>
        <div className={styles.iconWrap}>
          <img
            src={visuals?.icon || "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}
            alt={visuals?.label || "Item"}
            width={40}
            height={40}
            className={styles.icon}
          />
        </div>

        <div className={styles.body}>
          <div className={styles.titleRow}>
            <strong className={styles.itemTitle}>{visuals?.label || "Unknown item"}</strong>
          </div>

          <div className={styles.meta} style={{ marginTop: 4 }}>
            {reason}
          </div>
        </div>
      </div>

      {/* right-side: current ilvl */}
      <div className={styles.right}>
        <div className={styles.upgradePill} title="Current ilvl for this item">
          <span className={styles.upgradeDelta}>
            {typeof ilvl === "number" ? `ilvl ${ilvl}` : "ilvl —"}
          </span>
        </div>
      </div>
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────
   helpers
────────────────────────────────────────────────────────────── */

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function numberOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function inferWhyNotReason(p: ItemPlan, ceilingIlvl: number): string {
  // allow for planner-provided notes if present
  const meta = p as unknown as Record<string, unknown>;
  const explicit =
    (typeof meta.reason === "string" && meta.reason.trim()) ||
    (typeof meta.skipReason === "string" && meta.skipReason.trim()) ||
    (typeof meta.note === "string" && meta.note.trim());
  if (explicit) return explicit;

  const fromIlvl = isFiniteNumber(p.fromIlvl) ? p.fromIlvl : undefined;
  const toIlvl = isFiniteNumber(p.toIlvl) ? p.toIlvl : undefined;
  const fromRank = isFiniteNumber(p.fromRank) ? p.fromRank : undefined;
  const toRank = isFiniteNumber(p.toRank) ? p.toRank : undefined;

  if (typeof fromIlvl === "number" && fromIlvl >= ceilingIlvl) return "At ceiling";
  if (typeof toRank === "number" && typeof fromRank === "number" && toRank <= fromRank) return "Already at best rank";
  if (typeof toIlvl === "number" && typeof fromIlvl === "number" && toIlvl <= fromIlvl) return "No ilvl gain";
  return "Lower impact than other upgrades";
}
