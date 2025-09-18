import { useEffect, useMemo, useRef } from "react";
import styles from "./components.module.css";
import { SLOT_DISPLAY, normalizeSlot } from "../services/slotMap";
import type { ParsedItem, SlotKey, ItemPlan, Crest } from "../types/simc";
import { ItemIcon } from "./ItemIcon";
import { WowheadLink } from "./WowheadLink";
import { refreshWowheadTooltips } from "./WowheadProvider";
import { useItemMeta } from "../hooks/useItemMeta";
import { ArrowRight } from "lucide-react";
import type { DisplayRarity } from "../services/rarity";
import { useDisplayRarity } from "../hooks/useDisplayRarity";

type ItemBySlot = Partial<Record<SlotKey, ParsedItem>>;
type PlanBySlot = Partial<Record<SlotKey, ItemPlan>>;

/* ──────────────────────────────────────────────────────────────
   Local helpers
────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────
   Slot card
────────────────────────────────────────────────────────────── */

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
  const hasUpgrade =
    !!plan &&
    typeof plan.toRank === "number" &&
    typeof plan.fromRank === "number" &&
    plan.toRank > plan.fromRank;
  const hasSecondary = (hasUpgrade && !!plan) || !!item?.crafted;

  // Variant-aware meta (Wowhead rarity + icon)
  const meta = useItemMeta(item?.id, {
    bonusIds: item?.bonusIds,
    level: item?.ilvl,
  });

  // keep deps simple for eslint
  const bonusKey = useMemo(() => (item?.bonusIds ?? []).join(":"), [item?.bonusIds]);

  useEffect(() => {
    refreshWowheadTooltips();
  }, [item?.id, item?.ilvl, bonusKey]);

  // Use SimC name; ItemMeta intentionally doesn't expose a name
  const nameText = item?.name || (item?.id ? `#${item.id}` : "—");

  const RightPill = () => {
    const isUpgrade = hasUpgrade && !!plan;
    const displayIlvl =
      isUpgrade && plan
        ? plan.toIlvl
        : typeof item?.ilvl === "number"
        ? item.ilvl
        : undefined;

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
      <ItemIcon itemId={item?.id} alt={nameText} size={48} iconUrl={meta?.iconUrl} />
    </div>
  );

  const NameRow = (
    <div className={`${styles.nameRow} ${!hasSecondary ? styles.isSolo : ""}`}>
      <div className={styles.itemName}>{nameText}</div>
    </div>
  );

  const PillsRow = () =>
    hasSecondary ? (
      <div className={styles.pillsRow}>
        {hasUpgrade && plan ? (
          <div className={styles.upgradePillSecondary} title={crestTotalsText(plan)}>
            <span>Upgrade: {plan.fromIlvl}</span>
            <ArrowRight size={14} strokeWidth={2} aria-hidden />
            <span>{plan.toIlvl}</span>
          </div>
        ) : (
          <div className={styles.craftedPill}>
            <span>Crafted item</span>
            <ArrowRight size={14} strokeWidth={2} aria-hidden />
            <span>no crest upgrades</span>
          </div>
        )}
      </div>
    ) : null;

  // hook up Wowhead rarity (q0..q8) via anchor ref
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const displayRarity: DisplayRarity | undefined = useDisplayRarity(linkRef.current, [
    item?.id,
    item?.ilvl,
    bonusKey,
  ]);

  return (
    <div
      className={`${styles.slotCard} ${!showLabel ? styles.noLabel : ""} ${className ?? ""}`}
      data-rarity={displayRarity} // ← drives CSS color/border
      data-has-upgrade={hasUpgrade || undefined}
      data-crafted={item?.crafted || undefined}
    >
      {showLabel && <div className={styles.slotLabel}>{SLOT_DISPLAY[slot]}</div>}
      <div className={styles.pillTopRight}>
        <RightPill />
      </div>

      {item ? (
        item.id ? (
          <WowheadLink
            ref={linkRef}
            itemId={item.id}          // ← renamed (was `id`)
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

/* ──────────────────────────────────────────────────────────────
   Paperdoll
────────────────────────────────────────────────────────────── */

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
