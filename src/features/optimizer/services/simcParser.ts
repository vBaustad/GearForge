// src/features/optimizer/services/simcParser.ts
import type {
  CatalystCurrency,
  UpgradeWalletEntry,
  AchievementId,
  SlotWatermark,
  CharacterUpgradeContext,
  ParsedItem,
  CharacterMeta,
  ProfessionRank,
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

function extractSimple(all: string[], key: string): string | null {
  // Matches lines like: key=value  (not comment lines)
  // Accepts optional quotes: key="value"
  const row = all.find(l => !l.trim().startsWith("#") && l.trim().toLowerCase().startsWith(`${key.toLowerCase()}=`));
  if (!row) return null;
  const idx = row.indexOf("=");
  if (idx < 0) return null;
  const raw = row.slice(idx + 1).trim();
  // strip quotes if present
  return raw.replace(/^"(.*)"$/, "$1");
}

function parseIntOrNull(s: string | null): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseProfessions(s: string | null): ProfessionRank[] {
  if (!s) return [];
  return s
    .split("/")
    .map(seg => seg.trim())
    .filter(Boolean)
    .map(seg => {
      const [name, valStr] = seg.split("=").map(t => t.trim());
      const value = Number(valStr);
      if (!name || !Number.isFinite(value)) return null;
      return { name, value } as ProfessionRank;
    })
    .filter((x): x is ProfessionRank => !!x);
}

function parseSavedLoadouts(lines: string[]): Array<{ name: string; talents: string }> {
  // Lines look like:
  // # Saved Loadout: Single Target
  // # talents=CYG...
  const out: Array<{ name: string; talents: string }> = [];
  let pendingName: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("# Saved Loadout:")) {
      pendingName = line.replace(/^#\s*Saved Loadout:\s*/i, "").trim();
      continue;
    }
    if (pendingName && line.startsWith("# talents=")) {
      const idx = line.indexOf("=");
      const talents = idx >= 0 ? line.slice(idx + 1).trim() : "";
      if (talents) out.push({ name: pendingName, talents });
      pendingName = null;
    }
  }
  return out;
}

function parseHeaderLine(line: string): {
  spec: string | null;
  timestamp: string | null;
  regionRealm: string | null;
} {
  // Example:
  // "# Ryggsekken - Balance - 2025-08-31 14:43 - EU/Stormscale"
  const clean = line.replace(/^#\s*/, "");
  const parts = clean.split(" - ").map(s => s.trim());
  // parts[0] might be character name; we don't rely on it here
  const spec = parts[1] ?? null;
  const timestamp = parts[2] ?? null;
  const regionRealm = parts[3] ?? null;
  return { spec, timestamp, regionRealm };
}

function buildArmoryUrl(meta: { region: string | null; server: string | null; name: string | null }, locale?: string): string | undefined {
  const { region, server, name } = meta;
  if (!region || !server || !name) return undefined;

  // Basic locale fallback by region (you can improve this later via user settings)
  const defaultLocale = region.toLowerCase() === "eu" ? "en-gb"
    : region.toLowerCase() === "us" ? "en-us"
    : region.toLowerCase() === "kr" ? "ko-kr"
    : region.toLowerCase() === "tw" ? "zh-tw"
    : "en-us";

  const loc = locale ?? defaultLocale;

  // Slugify: lowercase + replace spaces/apostrophes with hyphens
  const slug = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, "-");

  return `https://worldofwarcraft.blizzard.com/${loc}/character/${region.toLowerCase()}/${slug(server)}/${slug(name)}`;
}

/* ---------- public API: character meta parsing ---------- */

export function parseCharacterMeta(simcText: string): CharacterMeta {
  const lines = simcText.split(/\r?\n/);

  const classLine = lines.find(l => !l.trim().startsWith("#") && /^[a-z_]+\s*=\s*".*"$/.test(l.trim()));
  // e.g., druid="Ryggsekken"
  let className: string | null = null;
  let name: string | null = null;
  if (classLine) {
    const m = classLine.trim().match(/^([a-z_]+)\s*=\s*"([^"]+)"$/i);
    if (m) {
      className = m[1].toLowerCase();
      name = m[2];
    }
  }

  const spec = extractSimple(lines, "spec");
  const level = parseIntOrNull(extractSimple(lines, "level"));
  const race = extractSimple(lines, "race");
  const region = extractSimple(lines, "region");
  const server = extractSimple(lines, "server");
  const role = extractSimple(lines, "role");
  const professions = parseProfessions(extractSimple(lines, "professions"));
  const talentsString = extractSimple(lines, "talents");

  // Header line (first line that starts with '# ' and looks like the character header)
  const headerLine = lines.find(l => l.trim().startsWith("# ") && / - .* - .* - .*\//.test(l));
  const headerParsed = headerLine ? parseHeaderLine(headerLine.trim()) : { spec: null, timestamp: null, regionRealm: null };

  const savedLoadouts = parseSavedLoadouts(lines);

  const meta: CharacterMeta = {
    name,
    className,
    spec,
    level,
    race,
    region,
    server,
    role,
    professions,
    talentsString,
    savedLoadouts,
    headerLineSpec: headerParsed.spec,
    headerLineTimestamp: headerParsed.timestamp,
    headerLineRegionRealm: headerParsed.regionRealm,
  };

  meta.armoryUrl = buildArmoryUrl(meta);

  return meta;
}

/* ---------- convenience combo ---------- */

export function parseSimcAll(simcText: string): {
  items: ParsedItem[];
  upgradeCtx: CharacterUpgradeContext;
  meta: CharacterMeta;
} {
  const upgradeCtx = parseCharacterUpgradeContext(simcText);
  const items = parseSimc(simcText);
  const meta = parseCharacterMeta(simcText);
  return { items, upgradeCtx, meta };
}