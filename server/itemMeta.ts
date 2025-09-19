// server/itemMeta.ts
import { getItemIcon } from "./blizzard";

export type ItemMeta = {
  iconUrl?: string;
  iconName?: string;
  // name?: string; // keep if you plan to add names later
};

export type ItemMetaOpts = {
  // kept for signature stability; not used for icons
  bonusIds?: number[];
  level?: number;
  context?: string;
};

export async function getItemMeta(id: number, opts?: ItemMetaOpts): Promise<ItemMeta> {
  // Signature parity with client; options currently unused for icon lookup.
  // Using `void` appeases @typescript-eslint/no-unused-vars without disabling the rule.
  void opts;

  // Blizzard icons are variant-agnostic; just fetch once (blizzard.ts already caches)
  const { iconUrl, iconName } = await getItemIcon(id);
  return { iconUrl, iconName };
}

export type { ItemMetaOpts as MetaOpts };
