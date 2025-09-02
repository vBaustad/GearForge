// src/features/optimizer/services/itemMeta.ts
export type RarityToken =
  | "poor" | "common" | "uncommon" | "rare" | "epic"
  | "legendary" | "artifact" | "heirloom";

export interface ItemMeta { iconUrl: string; iconName?: string; rarity?: RarityToken }

const cache = new Map<number, ItemMeta>();

export async function getItemMeta(id: number): Promise<ItemMeta> {
  const hit = cache.get(id);
  if (hit) return hit;
  const r = await fetch(`/api/wow/item/${id}/meta`);
  const j = (await r.json()) as ItemMeta & { error?: string };
  if (!r.ok || !j.iconUrl) throw new Error(j.error || `meta failed for ${id}`);
  cache.set(id, j);
  return j;
}
