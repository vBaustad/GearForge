// src/features/optimizer/services/itemMeta.ts
export type ItemMeta = { iconUrl?: string; iconName?: string };
export type ItemMetaOpts = { bonusIds?: number[]; level?: number; context?: string };

export async function getItemMeta(
  id?: number,
  opts: ItemMetaOpts = {}
): Promise<ItemMeta | undefined> {
  if (!id) return undefined;

  const qs = new URLSearchParams();
  // kept for signature stability; server ignores for icons
  if (typeof opts.level === "number") qs.set("level", String(opts.level));
  if (opts.bonusIds?.length) qs.set("bonus", opts.bonusIds.join(":"));
  if (opts.context) qs.set("context", opts.context);

  const r = await fetch(`$/api/wow/item/${id}/meta${qs.size ? `?${qs}` : ""}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<ItemMeta>;
}
