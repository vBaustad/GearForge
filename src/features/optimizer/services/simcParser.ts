// src/features/optimizer/services/simcParser.ts
import type {
  CatalystCurrency,
  UpgradeWalletEntry,
  AchievementId,
  SlotWatermark,
  CharacterUpgradeContext,
  ParsedItem,
} from "../types/simc";
import { SIMC_TO_USER_SLOT } from "./slotMap";

/* ---------- constants ---------- */

const EQUIPPED_SLOTS = new Set([
  "head","neck","shoulder","back","chest",
  "wrist","hands","waist","legs","feet",
  "finger1","finger2","trinket1","trinket2",
  "main_hand","off_hand",
]);

/* ---------- small helpers ---------- */

/** Finds the line that looks like `# key=...` and returns everything after '=' */
function extractAfterEquals(all: string[], key: string): string {
  // accept '#key=' OR '# key=' (some SimC variants)
  const row =
    all.find(l => l.trim().startsWith(`# ${key}=`)) ??
    all.find(l => l.trim().startsWith(`#${key}=`)) ??
    "";
  const idx = row.indexOf("=");
  return idx >= 0 ? row.slice(idx + 1).trim() : "";
}

function parseCatalyst(line: string): CatalystCurrency[] {
  if (!line) return [];
  return line.split("/").filter(Boolean).map(seg => {
    const [id, qty] = seg.split(":").map(Number);
    if (!Number.isFinite(id) || !Number.isFinite(qty)) return null;
    return { currencyId: id, quantity: qty };
  }).filter((x): x is CatalystCurrency => !!x);
}

function parseUpgradeWallet(line: string): UpgradeWalletEntry[] {
  if (!line) return [];
  return line.split("/").filter(Boolean).map(seg => {
    const [kind, idStr, qtyStr] = seg.split(":");
    const id = Number(idStr), qty = Number(qtyStr);
    if (!Number.isFinite(id) || !Number.isFinite(qty)) return null;

    if (kind === "c") return { kind: "currency", currencyId: id, quantity: qty } as const;
    if (kind === "i") return { kind: "item", itemId: id, quantity: qty } as const;

    // Unknown entry type — ignore instead of throwing
    return null;
  }).filter((x): x is UpgradeWalletEntry => !!x);
}

function parseWatermarksSimcToUser(line: string): SlotWatermark[] {
  if (!line) return [];
  return line.split("/").filter(Boolean).map(seg => {
    const [simcSlotStr, currentStr, maxStr] = seg.split(":");
    const simcSlot = Number(simcSlotStr);
    const userSlot = SIMC_TO_USER_SLOT[simcSlot];
    const current = Number(currentStr);
    const max = Number(maxStr);
    if (!userSlot || !Number.isFinite(current) || !Number.isFinite(max)) return null;
    return { slot: userSlot, current, max };
  }).filter((x): x is SlotWatermark => !!x);
}

function parseAchievements(line: string): AchievementId[] {
  if (!line) return [];
  return line.split("/").filter(Boolean).map(n => Number(n))
    .filter((n): n is AchievementId => Number.isFinite(n));
}

/* ---------- public API: context parsing ---------- */

export function buildCharacterUpgradeContext(opts: {
  catalystLine: string;
  upgradeWalletLine: string;
  watermarksLine: string;
  achievementsLine: string;
}): CharacterUpgradeContext {
  return {
    catalyst:     parseCatalyst(opts.catalystLine),
    wallet:       parseUpgradeWallet(opts.upgradeWalletLine),
    watermarks:   parseWatermarksSimcToUser(opts.watermarksLine),
    achievements: parseAchievements(opts.achievementsLine),
  };
}

/** Parse just the meta/upgrade context from a full SimC blob. */
export function parseCharacterUpgradeContext(simcText: string): CharacterUpgradeContext {
  const lines = simcText.split(/\r?\n/);
  return buildCharacterUpgradeContext({
    catalystLine:     extractAfterEquals(lines, "catalyst_currencies"),
    upgradeWalletLine: extractAfterEquals(lines, "upgrade_currencies"),
    watermarksLine:   extractAfterEquals(lines, "slot_high_watermarks"),
    achievementsLine: extractAfterEquals(lines, "upgrade_achievements"),
  });
}

/** Convenience: parse items AND context together. */
export function parseSimcAndUpgradeCtx(simcText: string): { items: ParsedItem[]; upgradeCtx: CharacterUpgradeContext } {
  const upgradeCtx = parseCharacterUpgradeContext(simcText);
  const items = parseSimc(simcText);
  return { items, upgradeCtx };
}

/* ---------- public API: equipped items parsing ---------- */

export function parseSimc(text: string): ParsedItem[] {
  const lines = text.split(/\r?\n/);

  // We only want the EQUIPPED set. SimC lists equipped first, then "### Gear from Bags".
  // The robust way: only keep the FIRST occurrence we see for each equipped slot.
  const seenSlots = new Set<string>();

  let lastCommentName: string | undefined;
  let lastCommentIlvl: number | undefined;

  const items: ParsedItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();

    // Pull name + ilvl from comment lines like: "# Skymane of the Mother Eagle (701)"
    if (raw.startsWith("#")) {
      const m = raw.match(/^#\s*([^#(]+?)\s*\((\d+)\)\s*$/);
      if (m) {
        lastCommentName = m[1].trim();
        lastCommentIlvl = Number(m[2]);
      } else {
        lastCommentName = undefined;
        lastCommentIlvl = undefined;
      }
      continue;
    }

    // slot line?
    const eq = raw.match(/^([a-z_0-9]+)\s*=\s*(.*)$/i);
    if (!eq) continue;

    const slot = eq[1].toLowerCase();
    if (!EQUIPPED_SLOTS.has(slot)) {
      // reset the comment carry-over so we don't mis-attach names/ilvls
      lastCommentName = undefined;
      lastCommentIlvl = undefined;
      continue;
    }

    // keep only the first occurrence of each equipped slot (equipped set appears first)
    if (seenSlots.has(slot)) {
      lastCommentName = undefined;
      lastCommentIlvl = undefined;
      continue;
    }

    const rhs = eq[2]; // ",id=...,gem_id=...,bonus_id=...,enchant_id=...,crafted_stats=..."
    const kvs = rhs.split(",").map(s => s.trim()).filter(Boolean);

    let id: number | undefined;
    let enchantId: number | undefined;
    const gemIds: number[] = [];
    const bonusIds: number[] = [];

    // Crafted markers (examples: crafted_stats=, crafting_quality=, titan_disc_id=, spark)
    const crafted = /(?:\bcrafted_stats=|\bcrafting_quality=|\btitan_disc_id=|\bspark\b)/i.test(rhs);

    for (const kv of kvs) {
      const [key, valRaw] = kv.split("=");
      if (!key) continue;
      const k = key.toLowerCase();
      const val = (valRaw ?? "").trim();

      if (k === "id") {
        const n = Number(val);
        if (Number.isFinite(n)) id = n;
      } else if (k === "enchant_id") {
        const n = Number(val);
        if (Number.isFinite(n)) enchantId = n;
      } else if (k === "gem_id") {
        const parts = val.split("/").map(Number).filter(Number.isFinite);
        gemIds.push(...parts);
      } else if (k === "bonus_id" || k === "bonusids") {
        const parts = val.split("/").map(Number).filter(Number.isFinite);
        bonusIds.push(...parts);
      }
    }

    if (typeof id === "number") {
      items.push({
        slot,
        id,
        name: lastCommentName,
        ilvl: lastCommentIlvl,
        enchantId,
        gemIds: gemIds.length ? gemIds : undefined,
        bonusIds: bonusIds.length ? bonusIds : undefined,
        raw,
        crafted,
      });
      seenSlots.add(slot);
    }

    // clear the carried comment so it doesn't leak to the next slot
    lastCommentName = undefined;
    lastCommentIlvl = undefined;
  }

  return items;
}
