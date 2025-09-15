export type SpecRef = {
  classSlug: string;
  className: string;
  specSlug: string;
  specName: string;
};

export type ClassRef = {
  slug: string;
  name: string;
};

// Minimal full list for routing + icons. Icon path is `/images/icons/specs/${classSlug}-${specSlug}.jpg`.
export const SPECS: SpecRef[] = [
  // Death Knight
  { classSlug: "dk", className: "Death Knight", specSlug: "blood", specName: "Blood" },
  { classSlug: "dk", className: "Death Knight", specSlug: "frost", specName: "Frost" },
  { classSlug: "dk", className: "Death Knight", specSlug: "unholy", specName: "Unholy" },
  // Demon Hunter
  { classSlug: "dh", className: "Demon Hunter", specSlug: "havoc", specName: "Havoc" },
  { classSlug: "dh", className: "Demon Hunter", specSlug: "vengeance", specName: "Vengeance" },
  // Druid
  { classSlug: "druid", className: "Druid", specSlug: "balance", specName: "Balance" },
  { classSlug: "druid", className: "Druid", specSlug: "feral", specName: "Feral" },
  { classSlug: "druid", className: "Druid", specSlug: "guardian", specName: "Guardian" },
  { classSlug: "druid", className: "Druid", specSlug: "restoration", specName: "Restoration" },
  // Evoker
  { classSlug: "evoker", className: "Evoker", specSlug: "devastation", specName: "Devastation" },
  { classSlug: "evoker", className: "Evoker", specSlug: "preservation", specName: "Preservation" },
  { classSlug: "evoker", className: "Evoker", specSlug: "augmentation", specName: "Augmentation" },
  // Hunter
  { classSlug: "hunter", className: "Hunter", specSlug: "beast-mastery", specName: "Beast Mastery" },
  { classSlug: "hunter", className: "Hunter", specSlug: "marksmanship", specName: "Marksmanship" },
  { classSlug: "hunter", className: "Hunter", specSlug: "survival", specName: "Survival" },
  // Mage
  { classSlug: "mage", className: "Mage", specSlug: "arcane", specName: "Arcane" },
  { classSlug: "mage", className: "Mage", specSlug: "fire", specName: "Fire" },
  { classSlug: "mage", className: "Mage", specSlug: "frost", specName: "Frost" },
  // Monk
  { classSlug: "monk", className: "Monk", specSlug: "brewmaster", specName: "Brewmaster" },
  { classSlug: "monk", className: "Monk", specSlug: "mistweaver", specName: "Mistweaver" },
  { classSlug: "monk", className: "Monk", specSlug: "windwalker", specName: "Windwalker" },
  // Paladin
  { classSlug: "paladin", className: "Paladin", specSlug: "holy", specName: "Holy" },
  { classSlug: "paladin", className: "Paladin", specSlug: "protection", specName: "Protection" },
  { classSlug: "paladin", className: "Paladin", specSlug: "retribution", specName: "Retribution" },
  // Priest
  { classSlug: "priest", className: "Priest", specSlug: "discipline", specName: "Discipline" },
  { classSlug: "priest", className: "Priest", specSlug: "holy", specName: "Holy" },
  { classSlug: "priest", className: "Priest", specSlug: "shadow", specName: "Shadow" },
  // Rogue
  { classSlug: "rogue", className: "Rogue", specSlug: "assassination", specName: "Assassination" },
  { classSlug: "rogue", className: "Rogue", specSlug: "outlaw", specName: "Outlaw" },
  { classSlug: "rogue", className: "Rogue", specSlug: "subtlety", specName: "Subtlety" },
  // Shaman
  { classSlug: "shaman", className: "Shaman", specSlug: "elemental", specName: "Elemental" },
  { classSlug: "shaman", className: "Shaman", specSlug: "enhancement", specName: "Enhancement" },
  { classSlug: "shaman", className: "Shaman", specSlug: "restoration", specName: "Restoration" },
  // Warlock
  { classSlug: "warlock", className: "Warlock", specSlug: "affliction", specName: "Affliction" },
  { classSlug: "warlock", className: "Warlock", specSlug: "demonology", specName: "Demonology" },
  { classSlug: "warlock", className: "Warlock", specSlug: "destruction", specName: "Destruction" },
  // Warrior
  { classSlug: "warrior", className: "Warrior", specSlug: "arms", specName: "Arms" },
  { classSlug: "warrior", className: "Warrior", specSlug: "fury", specName: "Fury" },
  { classSlug: "warrior", className: "Warrior", specSlug: "protection", specName: "Protection" },
];

// Build icon paths from display names to match new assets:
// - Class icons:  /images/icons/classes/{Class Name}.jpg
// - Spec icons:   /images/icons/specs/{Class Name} - {Spec Name}.jpg
export function iconForSpec(classSlug: string, specSlug: string): string {
  const sp = SPECS.find(s => s.classSlug === classSlug && s.specSlug === specSlug);
  if (!sp) return "/images/favicon-32x32.png"; // fallback tiny icon
  return `/images/icons/specs/${sp.className} - ${sp.specName}.jpg`;
}

export const CLASSES: ClassRef[] = Array.from(
  new Map(SPECS.map(s => [s.classSlug, s.className])).entries()
).map(([slug, name]) => ({ slug, name }));

export function iconForClass(classSlug: string): string {
  const clazz = CLASSES.find(c => c.slug === classSlug);
  if (!clazz) return "/images/favicon-32x32.png";
  return `/images/icons/classes/${clazz.name}.jpg`;
}
