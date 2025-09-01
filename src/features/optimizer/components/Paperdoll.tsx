// src/features/optimizer/components/Paperdoll.tsx
import { useEffect } from "react";
import styles from "./components.module.css";
import { SLOT_DISPLAY, normalizeSlot } from "../services/slotMap";
import type { ParsedItem, SlotKey, ItemPlan, Crest } from "../types/simc";
import { ItemIcon } from "./ItemIcon";
import { WowheadLink } from "./WowheadLink";
import { refreshWowheadTooltips } from "./WowheadProvider";

type ItemBySlot = Partial<Record<SlotKey, ParsedItem>>;
type PlanBySlot = Partial<Record<SlotKey, ItemPlan>>;

// Typed entries helper for Partial<Record<Crest, number>>
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

function SlotCard({
  slot,
  item,
  plan,
}: {
  slot: SlotKey;
  item?: ParsedItem;
  plan?: ItemPlan;
}) {
  const hasUpgrade = !!plan && plan.toRank > plan.fromRank;

  // refresh Wowhead tooltips when the item changes
  useEffect(() => {
    refreshWowheadTooltips();
  }, [item?.id, item?.ilvl, (item?.bonusIds ?? []).join(":")]);

  const nameText = item?.name ?? (item?.id ? `#${item.id}` : "—");

  return (
    <div className={styles.slotCard}>
      <div className={styles.slotLabel}>{SLOT_DISPLAY[slot]}</div>

      {item ? (
        <>
          {/* One hotspot: icon + name (+ meta) wrapped in a single link */}
          {item.id ? (
            <WowheadLink
              id={item.id}
              ilvl={item.ilvl}
              bonusIds={item.bonusIds}
              title={nameText}
              className={styles.slotItem} /* re-use your existing grid styling */
            >
              <ItemIcon itemId={item.id} alt={nameText} />
              <div className={styles.itemText}>
                <div className={styles.itemName}>{nameText}</div>
                <div className={styles.itemMeta}>
                  ilvl {item.ilvl ?? "—"} <span className={styles.itemId}>ID {item.id}</span>
                </div>
              </div>
            </WowheadLink>
          ) : (
            <div className={styles.slotItem}>
              <ItemIcon itemId={undefined} alt={nameText} />
              <div className={styles.itemText}>
                <div className={styles.itemName}>{nameText}</div>
                <div className={styles.itemMeta}>
                  ilvl {item.ilvl ?? "—"} <span className={styles.itemId}>ID {item.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Badges live outside the link so only icon+name are clickable */}
          {item.crafted && (
            <div className={styles.planBadge}>Crafted item — no crest upgrades</div>
          )}

          {hasUpgrade && plan && (
            <div className={styles.planBadgeGood}>
              Upgrade: {plan.fromIlvl} → {plan.toIlvl} (r{plan.fromRank}→{plan.toRank}) •{" "}
              {crestTotalsText(plan)}
            </div>
          )}
        </>
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
      <SlotCard slot="head"     item={bySlot.head}     plan={planMap.head} />
      <SlotCard slot="neck"     item={bySlot.neck}     plan={planMap.neck} />
      <SlotCard slot="shoulder" item={bySlot.shoulder} plan={planMap.shoulder} />
      <SlotCard slot="back"     item={bySlot.back}     plan={planMap.back} />
      <SlotCard slot="chest"    item={bySlot.chest}    plan={planMap.chest} />
      <SlotCard slot="wrist"    item={bySlot.wrist}    plan={planMap.wrist} />
      <SlotCard slot="hands"    item={bySlot.hands}    plan={planMap.hands} />
      <SlotCard slot="waist"    item={bySlot.waist}    plan={planMap.waist} />
      <SlotCard slot="legs"     item={bySlot.legs}     plan={planMap.legs} />
      <SlotCard slot="feet"     item={bySlot.feet}     plan={planMap.feet} />

      {/* Right column */}
      <SlotCard slot="finger1"  item={bySlot.finger1}  plan={planMap.finger1} />
      <SlotCard slot="finger2"  item={bySlot.finger2}  plan={planMap.finger2} />
      <SlotCard slot="trinket1" item={bySlot.trinket1} plan={planMap.trinket1} />
      <SlotCard slot="trinket2" item={bySlot.trinket2} plan={planMap.trinket2} />

      {/* Bottom weapons */}
      <SlotCard slot="main_hand" item={bySlot.main_hand} plan={planMap.main_hand} />
      <SlotCard slot="off_hand"  item={bySlot.off_hand}  plan={planMap.off_hand} />
    </section>
  );
}
