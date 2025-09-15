// src/features/guides/guideLinks.ts
// External class/spec guide links (Wowhead, Method, Icy Veins, Maxroll)
// Keys match your route format: /guides/classes/:classKey/:specKey
//
// classKey:  dk | dh | warrior | paladin | hunter | rogue | priest | shaman | mage | warlock | monk | druid | evoker
// specKey:   per class (e.g. dk/blood, hunter/beastmastery, monk/windwalker, etc.)

export type SiteId = "wowhead" | "method" | "icyveins" | "maxroll";

export interface GuideLink {
  site: SiteId;
  url: string;
  title?: string;
  notes?: string;
}

// ---------- Slugs & roles ----------

const CLASS_SLUG = {
  dk: "death-knight",
  dh: "demon-hunter",
  warrior: "warrior",
  paladin: "paladin",
  hunter: "hunter",
  rogue: "rogue",
  priest: "priest",
  shaman: "shaman",
  mage: "mage",
  warlock: "warlock",
  monk: "monk",
  druid: "druid",
  evoker: "evoker",
} as const;

type Role = "dps" | "tank" | "healing";

// Role per spec (for Wowhead & Icy Veins paths)
const SPEC_ROLE: Record<string, Role> = {
  // DK
  "dk-blood": "tank",
  "dk-frost": "dps",
  "dk-unholy": "dps",
  // DH
  "dh-havoc": "dps",
  "dh-vengeance": "tank",
  // Warrior
  "warrior-arms": "dps",
  "warrior-fury": "dps",
  "warrior-protection": "tank",
  // Paladin
  "paladin-holy": "healing",
  "paladin-protection": "tank",
  "paladin-retribution": "dps",
  // Hunter
  "hunter-beast-mastery": "dps",
  "hunter-marksmanship": "dps",
  "hunter-survival": "dps",
  // Rogue
  "rogue-assassination": "dps",
  "rogue-outlaw": "dps",
  "rogue-subtlety": "dps",
  // Priest
  "priest-discipline": "healing",
  "priest-holy": "healing",
  "priest-shadow": "dps",
  // Shaman
  "shaman-elemental": "dps",
  "shaman-enhancement": "dps",
  "shaman-restoration": "healing",
  // Mage
  "mage-arcane": "dps",
  "mage-fire": "dps",
  "mage-frost": "dps",
  // Warlock
  "warlock-affliction": "dps",
  "warlock-demonology": "dps",
  "warlock-destruction": "dps",
  // Monk
  "monk-brewmaster": "tank",
  "monk-mistweaver": "healing",
  "monk-windwalker": "dps",
  // Druid
  "druid-balance": "dps",
  "druid-feral": "dps",
  "druid-guardian": "tank",
  "druid-restoration": "healing",
  // Evoker
  "evoker-devastation": "dps",
  "evoker-preservation": "healing",
  "evoker-augmentation": "dps",
};

// Normalize spec slugs across sites
const SPEC_SLUG = {
  // DK
  blood: "blood",
  frost: "frost",
  unholy: "unholy",
  // DH
  havoc: "havoc",
  vengeance: "vengeance",
  // Warrior
  arms: "arms",
  fury: "fury",
  protection: "protection",
  retribution: "retribution",
  // Hunter
  beastmastery: "beast-mastery",
  "beast-mastery": "beast-mastery",
  marksmanship: "marksmanship",
  survival: "survival",
  // Rogue
  assassination: "assassination",
  outlaw: "outlaw",
  subtlety: "subtlety",
  // Priest
  discipline: "discipline",
  holy: "holy",
  shadow: "shadow",
  // Shaman
  elemental: "elemental",
  enhancement: "enhancement",
  restoration: "restoration",
  // Mage
  arcane: "arcane",
  fire: "fire",
  frost_: "frost", // helper if needed
  // Warlock
  affliction: "affliction",
  demonology: "demonology",
  destruction: "destruction",
  // Monk
  brewmaster: "brewmaster",
  mistweaver: "mistweaver",
  windwalker: "windwalker",
  // Druid
  balance: "balance",
  feral: "feral",
  guardian: "guardian",
  // Evoker
  devastation: "devastation",
  preservation: "preservation",
  augmentation: "augmentation",
} as const;

// ---------- URL builders ----------

function wowhead(classKey: keyof typeof CLASS_SLUG, specKey: keyof typeof SPEC_SLUG): string {
  const c = CLASS_SLUG[classKey];
  const s = SPEC_SLUG[specKey];
  const role = SPEC_ROLE[`${String(classKey)}-${s}`] ?? "dps";
  // Example: https://www.wowhead.com/guide/classes/monk/windwalker/overview-pve-dps
  return `https://www.wowhead.com/guide/classes/${c}/${s}/overview-pve-${role}`;
}

function method(classKey: keyof typeof CLASS_SLUG, specKey: keyof typeof SPEC_SLUG): string {
  const c = CLASS_SLUG[classKey];
  const s = SPEC_SLUG[specKey];
  // Example: https://www.method.gg/guides/frost-death-knight
  return `https://www.method.gg/guides/${s}-${c}`;
}

function icyVeins(classKey: keyof typeof CLASS_SLUG, specKey: keyof typeof SPEC_SLUG): string {
  const c = CLASS_SLUG[classKey];
  const s = SPEC_SLUG[specKey];
  const role = SPEC_ROLE[`${String(classKey)}-${s}`] ?? "dps";
  // Example: https://www.icy-veins.com/wow/balance-druid-pve-dps-guide
  const roleSegment = role === "healing" ? "healing" : role;
  return `https://www.icy-veins.com/wow/${s}-${c}-pve-${roleSegment}-guide`;
}

function maxroll(classKey: keyof typeof CLASS_SLUG, specKey: keyof typeof SPEC_SLUG): string {
  // Maxroll filter page that lets the user pick Raid / M+ / PvP for the class & spec.
  // Example provided by you (warlock+demonology):
  // https://maxroll.gg/wow/class-guides?filter[classes][taxonomy]=taxonomies.classes&filter[classes][value]=warlock&filter[classes][filters][0][taxonomy]=taxonomies.classes&filter[classes][filters][0][value]=demonology
  const c = CLASS_SLUG[classKey];                     // e.g., "death-knight", "demon-hunter", "warlock"
  const s = SPEC_SLUG[specKey];                       // e.g., "beast-mastery", "demonology"
  const base = new URL("https://maxroll.gg/wow/class-guides");
  const p = base.searchParams;
  p.set("filter[classes][taxonomy]", "taxonomies.classes");
  p.set("filter[classes][value]", c);
  p.set("filter[classes][filters][0][taxonomy]", "taxonomies.classes");
  p.set("filter[classes][filters][0][value]", s);
  return base.toString();
}

function makeLinks(
  classKey: keyof typeof CLASS_SLUG,
  specKey: keyof typeof SPEC_SLUG,
  titles?: Partial<Record<SiteId, string>>
): GuideLink[] {
  return [
    { site: "wowhead",  url: wowhead(classKey, specKey),  title: titles?.wowhead  },
    { site: "method",   url: method(classKey, specKey),   title: titles?.method   },
    { site: "icyveins", url: icyVeins(classKey, specKey), title: titles?.icyveins },
    { site: "maxroll",  url: maxroll(classKey, specKey),  title: titles?.maxroll  },
  ];
}

// ============================================================================
// Guide links grouped by class → spec
// ============================================================================

export const GUIDE_LINKS: Record<string, Record<string, GuideLink[]>> = {
  // ===== DEATH KNIGHT =====
  dk: {
    blood:       makeLinks("dk", "blood"),
    frost:       makeLinks("dk", "frost"),
    unholy:      makeLinks("dk", "unholy"),
  },

  // ===== DEMON HUNTER =====
  dh: {
    havoc:       makeLinks("dh", "havoc"),
    vengeance:   makeLinks("dh", "vengeance"),
  },

  // ===== WARRIOR =====
  warrior: {
    arms:        makeLinks("warrior", "arms"),
    fury:        makeLinks("warrior", "fury"),
    protection:  makeLinks("warrior", "protection"),
  },

  // ===== PALADIN =====
  paladin: {
    holy:        makeLinks("paladin", "holy"),
    protection:  makeLinks("paladin", "protection"),
    retribution: makeLinks("paladin", "retribution"),
  },

  // ===== HUNTER =====
  hunter: {
    beastmastery: makeLinks("hunter", "beastmastery"), // normalized to "beast-mastery" in builders
    marksmanship: makeLinks("hunter", "marksmanship"),
    survival:     makeLinks("hunter", "survival"),
  },

  // ===== ROGUE =====
  rogue: {
    assassination: makeLinks("rogue", "assassination"),
    outlaw:        makeLinks("rogue", "outlaw"),
    subtlety:      makeLinks("rogue", "subtlety"),
  },

  // ===== PRIEST =====
  priest: {
    discipline:  makeLinks("priest", "discipline"),
    holy:        makeLinks("priest", "holy"),
    shadow:      makeLinks("priest", "shadow"),
  },

  // ===== SHAMAN =====
  shaman: {
    elemental:   makeLinks("shaman", "elemental"),
    enhancement: makeLinks("shaman", "enhancement"),
    restoration: makeLinks("shaman", "restoration"),
  },

  // ===== MAGE =====
  mage: {
    arcane:      makeLinks("mage", "arcane"),
    fire:        makeLinks("mage", "fire"),
    frost:       makeLinks("mage", "frost"),
  },

  // ===== WARLOCK =====
  warlock: {
    affliction:  makeLinks("warlock", "affliction"),
    demonology:  makeLinks("warlock", "demonology"),
    destruction: makeLinks("warlock", "destruction"),
  },

  // ===== MONK =====
  monk: {
    brewmaster:  makeLinks("monk", "brewmaster"),
    mistweaver:  makeLinks("monk", "mistweaver"),
    windwalker:  makeLinks("monk", "windwalker"),
  },

  // ===== DRUID =====
  druid: {
    balance:     makeLinks("druid", "balance"),
    feral:       makeLinks("druid", "feral"),
    guardian:    makeLinks("druid", "guardian"),
    restoration: makeLinks("druid", "restoration"),
  },

  // ===== EVOKER =====
  evoker: {
    devastation:  makeLinks("evoker", "devastation"),
    preservation: makeLinks("evoker", "preservation"),
    augmentation: makeLinks("evoker", "augmentation"),
  },
};

// Helper: get all links for one class/spec
export function getGuideLinks(classKey: string, specKey: string): GuideLink[] {
  return GUIDE_LINKS[classKey]?.[specKey] ?? [];
}
