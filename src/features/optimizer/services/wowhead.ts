type WowheadOpts = {
  id: number;
  bonusIds?: number[] | string;      // "123/456/..." or "123:456:..." or [123,456]
  ilvl?: number;
  classId?: number;
  specId?: number;
};

function normalizeBonus(bonus?: number[] | string): string | undefined {
  if (!bonus) return undefined;
  const parts = Array.isArray(bonus)
    ? bonus
    : String(bonus).split(/[/:]/).filter(Boolean);
  return parts.length ? parts.join(":") : undefined;
}

/** Full page link (click-through) */
export function wowheadItemUrl({ id, bonusIds, ilvl, classId, specId }: WowheadOpts) {
  const qs = new URLSearchParams();
  const bonus = normalizeBonus(bonusIds);
  if (bonus) qs.set("bonus", bonus);
  if (ilvl) qs.set("ilvl", String(ilvl));
  if (classId) qs.set("class", String(classId));
  if (specId) qs.set("spec", String(specId));
  return `https://www.wowhead.com/item=${id}${qs.toString() ? `?${qs}` : ""}`;
}

/** Tooltip data attribute (Wowhead reads from data-wowhead="...") */
export function wowheadDataAttr({ bonusIds, ilvl, classId, specId }: Omit<WowheadOpts,"id">) {
  const params: string[] = [];
  const bonus = normalizeBonus(bonusIds);
  if (bonus) params.push(`bonus=${bonus}`);
  if (ilvl) params.push(`ilvl=${ilvl}`);
  if (classId) params.push(`class=${classId}`);
  if (specId) params.push(`spec=${specId}`);
  return params.join("&"); // empty string is fine
}
