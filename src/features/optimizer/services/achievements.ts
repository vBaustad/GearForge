// src/features/optimizer/services/achievements.ts
import type { AchievementId, CostVector, CurrencyId, ItemId } from "../types/simc";

export type DiscountRule =
  | { type: "percent"; currencyId?: CurrencyId; itemId?: ItemId; valuePct: number }
  | { type: "flat"; currencyId?: CurrencyId; itemId?: ItemId; value: number }
  | { type: "capUnlock"; capKey: string; newCap: number };

export type AchievementEffectMap = Record<AchievementId, DiscountRule[]>;

export const ACHIEVEMENT_EFFECTS: AchievementEffectMap = {
  // Fill as you confirm real effects per season
};

export function applyAchievementDiscounts(
  base: CostVector,
  achievements: AchievementId[],
  effectsMap: AchievementEffectMap = ACHIEVEMENT_EFFECTS
): CostVector {
  const out: CostVector = {
    currencies: base.currencies ? base.currencies.map(c => ({ ...c })) : [],
    items: base.items ? base.items.map(i => ({ ...i })) : [],
    caps: { ...(base.caps || {}) },
  };

  for (const a of achievements) {
    const rules = effectsMap[a];
    if (!rules) continue;

    for (const r of rules) {
      if (r.type === "percent") {
        const scale = (x: number) => Math.max(0, Math.ceil(x * (1 - r.valuePct / 100)));
        if (r.currencyId != null) out.currencies!.forEach(c => { if (c.currencyId === r.currencyId) c.amount = scale(c.amount); });
        else if (r.itemId != null) out.items!.forEach(i => { if (i.itemId === r.itemId) i.amount = scale(i.amount); });
        else { out.currencies!.forEach(c => c.amount = scale(c.amount)); out.items!.forEach(i => i.amount = scale(i.amount)); }
      } else if (r.type === "flat") {
        if (r.currencyId != null) out.currencies!.forEach(c => { if (c.currencyId === r.currencyId) c.amount = Math.max(0, c.amount - r.value); });
        else if (r.itemId != null) out.items!.forEach(i => { if (i.itemId === r.itemId) i.amount = Math.max(0, i.amount - r.value); });
      } else if (r.type === "capUnlock") {
        const cur = out.caps![r.capKey] ?? 0;
        out.caps![r.capKey] = Math.max(cur, r.newCap);
      }
    }
  }
  return out;
}
