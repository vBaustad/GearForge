// src/features/optimizer/components/Paperdoll.tsx
import { useEffect } from "react";
import styles from "./components.module.css";
import { SLOT_DISPLAY, normalizeSlot } from "../services/slotMap";
import type { ParsedItem, SlotKey, ItemPlan, Crest } from "../types/simc";
import { ItemIcon } from "./ItemIcon";
import { WowheadLink } from "./WowheadLink";
import { refreshWowheadTooltips } from "./WowheadProvider";
import { useItemMeta } from "../hooks/useItemMeta";
import { ArrowRight } from 'lucide-react';

type ItemBySlot = Partial<Record<SlotKey, ParsedItem>>;
type PlanBySlot = Partial<Record<SlotKey, ItemPlan>>;

type RarityToken =
  | "poor" | "common" | "uncommon" | "rare" | "epic"
  | "legendary" | "artifact" | "heirloom";

/** Typed entries helper for Partial<Record<Crest, number>> */
function crestTotalsEntries(
  totals: Partial<Record<Crest, number>> | undefined
): [Crest, number][] {
  if (!totals) return [];
  return Object.entries(totals) as [Crest, number][];
}

function buildItemMap(items: ParsedItem[]): ItemBySlot {
  const map: ItemBySlot = {};
  for (const it of items) {
    const s = normalizeSlot(it.slot);
    if (s) map[s] = it;
  }
  return map;
}

function crestTotalsText(plan?: ItemPlan) {
  if (!plan || plan.steps.length === 0) return "No upgrade";
  const parts = crestTotalsEntries(plan.crestTotals)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${v} ${k}`);
  return parts.join(" · ");
}

/** Numeric quality (0–7) → rarity token (fallback path) */
function qualityToToken(q: number): RarityToken | undefined {
  switch (q) {
    case 0: return "poor";
    case 1: return "common";
    case 2: return "uncommon";
    case 3: return "rare";
    case 4: return "epic";
    case 5: return "legendary";
    case 6: return "artifact";
    case 7: return "heirloom";
    default: return undefined;
  }
}

/** Fallback: try to derive rarity from ParsedItem if server meta is missing */
function getRarityToken(item?: ParsedItem): RarityToken | undefined {
  if (!item) return undefined;

  const textFields = item as unknown as {
    rarity?: unknown; qualityText?: unknown; qualityName?: unknown;
  };
  const text =
    (typeof textFields.rarity === "string" && textFields.rarity) ||
    (typeof textFields.qualityText === "string" && textFields.qualityText) ||
    (typeof textFields.qualityName === "string" && textFields.qualityName) ||
    undefined;

  if (typeof text === "string") {
    const t = text.trim().toLowerCase();
    const allowed: ReadonlyArray<RarityToken> = [
      "poor","common","uncommon","rare","epic","legendary","artifact","heirloom",
    ];
    return (allowed as readonly string[]).includes(t) ? (t as RarityToken) : undefined;
  }

  const numFields = item as unknown as {
    quality?: unknown; itemQuality?: unknown; qualityId?: unknown;
  };
  const q =
    (typeof numFields.quality === "number" && numFields.quality) ||
    (typeof numFields.itemQuality === "number" && numFields.itemQuality) ||
    (typeof numFields.qualityId === "number" && numFields.qualityId) ||
    undefined;

  return typeof q === "number" ? qualityToToken(q) : undefined;
}

function SlotCard({
  slot,
  item,
  plan,
  className,
  showLabel = false,
}: {
  slot: SlotKey;
  item?: ParsedItem;
  plan?: ItemPlan;
  className?: string;
  showLabel?: boolean;
}) {
  const hasUpgrade = !!plan && typeof plan.toRank === "number" && typeof plan.fromRank === "number" && plan.toRank > plan.fromRank;
  const hasSecondary = (hasUpgrade && !!plan) || !!item?.crafted;

  const meta = useItemMeta(item?.id);

  // refresh Wowhead tooltips when the item changes
  useEffect(() => {
    refreshWowheadTooltips();
  }, [item?.id, item?.ilvl, (item?.bonusIds ?? []).join(":")]);

  const nameText = item?.name ?? (item?.id ? `#${item.id}` : "—");
  const rarity: RarityToken | undefined = meta?.rarity ?? getRarityToken(item);

  // Right-side pill: upgrade (preferred) or ilvl
  const RightPill = () => {
    const isUpgrade = hasUpgrade && !!plan;
    const displayIlvl =
      isUpgrade && plan ? plan.toIlvl : (typeof item?.ilvl === "number" ? item.ilvl : undefined);

    return (
      <div className={isUpgrade ? styles.upgradePill : styles.ilvlPill}>
        <span className={styles.upgradeDelta}>
          {typeof displayIlvl === "number" ? `ilvl ${displayIlvl}` : "ilvl —"}
        </span>
      </div>
    );
  };

  const Icon = (
    <div className={styles.slotIcon}>
      <ItemIcon
        itemId={item?.id}
        alt={nameText}
        size={48}
        iconUrl={meta?.iconUrl}
      />
    </div>
  );

  const NameRow = (
    <div className={`${styles.nameRow} ${!hasSecondary ? styles.isSolo : ""}`}>
      <div className={styles.itemName}>{nameText}</div>
    </div>
  );

  // Pills row beneath the name: optional crafted/upgrade detail
  const PillsRow = () => (
    hasSecondary ? (
      <div className={styles.pillsRow}>
        {hasUpgrade && plan ? (
          <div
            className={styles.upgradePillSecondary}
            title={crestTotalsText(plan)}
          >
            <span>Upgrade: {plan.fromIlvl}</span>
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            <span>{plan.toIlvl}</span>
          </div>
        ) : (
          <div className={styles.craftedPill}>
            <span>Crafted item</span>
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            <span>no crest upgrades</span>
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <div
      className={`${styles.slotCard} ${!showLabel ? styles.noLabel : ""} ${className ?? ""}`}
      data-rarity={rarity}
      data-has-upgrade={hasUpgrade || undefined}
      data-crafted={item?.crafted || undefined}
      title={undefined}
    >
      {showLabel && <div className={styles.slotLabel}>{SLOT_DISPLAY[slot]}</div>}
      {/* Always-fixed ilvl pill top-right */}
      <div className={styles.pillTopRight}><RightPill /></div>

      {item ? (
        item.id ? (
          <WowheadLink
            id={item.id}
            ilvl={item.ilvl}
            bonusIds={item.bonusIds}
            title={nameText}
            className={styles.slotItem}
          >
            {Icon}
            <div className={`${styles.textCol} ${!hasSecondary ? styles.isSolo : ""}`}>
              {NameRow}
              <PillsRow />
            </div>
          </WowheadLink>
        ) : (
          <div className={styles.slotItem}>
            {Icon}
            <div className={`${styles.textCol} ${!hasSecondary ? styles.isSolo : ""}`}>
              {NameRow}
              <PillsRow />
            </div>
          </div>
        )
      ) : (
        <div className={styles.slotEmpty}>—</div>
      )}
    </div>
  );
}

export function Paperdoll({
  items,
  plans,
}: {
  items: ParsedItem[];
  plans?: ItemPlan[];
}) {
  const bySlot = buildItemMap(items);

  const planMap: PlanBySlot = {};
  for (const p of plans ?? []) {
    planMap[p.slot] = p;
  }

  // also refresh after the full list changes (SPA navigation, etc.)
  useEffect(() => {
    refreshWowheadTooltips();
  }, [items.length, plans?.length]);

  return (
    <section className={styles.paperdoll}>
      {/* Left column */}
      <SlotCard className={styles.colLeft}  slot="head"     item={bySlot.head}     plan={planMap.head} />
      <SlotCard className={styles.colLeft}  slot="neck"     item={bySlot.neck}     plan={planMap.neck} />
      <SlotCard className={styles.colLeft}  slot="shoulder" item={bySlot.shoulder} plan={planMap.shoulder} />
      <SlotCard className={styles.colLeft}  slot="back"     item={bySlot.back}     plan={planMap.back} />
      <SlotCard className={styles.colLeft}  slot="chest"    item={bySlot.chest}    plan={planMap.chest} />
      <SlotCard className={styles.colLeft}  slot="wrist"    item={bySlot.wrist}    plan={planMap.wrist} />
      <SlotCard className={styles.colLeft}  slot="trinket1" item={bySlot.trinket1} plan={planMap.trinket1} />

      {/* Right column */}
      <SlotCard className={styles.colRight} slot="hands"    item={bySlot.hands}    plan={planMap.hands} />
      <SlotCard className={styles.colRight} slot="waist"    item={bySlot.waist}    plan={planMap.waist} />
      <SlotCard className={styles.colRight} slot="legs"     item={bySlot.legs}     plan={planMap.legs} />
      <SlotCard className={styles.colRight} slot="feet"     item={bySlot.feet}     plan={planMap.feet} />
      <SlotCard className={styles.colRight} slot="finger1"  item={bySlot.finger1}  plan={planMap.finger1} />
      <SlotCard className={styles.colRight} slot="finger2"  item={bySlot.finger2}  plan={planMap.finger2} />
      <SlotCard className={styles.colRight} slot="trinket2" item={bySlot.trinket2} plan={planMap.trinket2} />

      {/* Bottom middle: weapons row */}
      <div className={styles.weaponsRow}>
        <SlotCard className={styles.weaponSlot} slot="main_hand" item={bySlot.main_hand} plan={planMap.main_hand} />
        <SlotCard className={styles.weaponSlot} slot="off_hand"  item={bySlot.off_hand}  plan={planMap.off_hand} />
      </div>
    </section>
  );
}
