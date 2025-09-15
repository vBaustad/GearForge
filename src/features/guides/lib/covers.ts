import type { GuidePost } from "../types";

// Fast FNV-1a hash for stable selection
function fnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h >>> 0) * 0x01000193; // 16777619
  }
  return h >>> 0;
}

function pickFromPool(seed: string, pool: string[]) {
  if (!pool.length) return undefined;
  const idx = fnv1a(seed) % pool.length;
  return pool[idx];
}

// Optional: bias toward images whose path contains a tag keyword
const DEFAULT_TAG_HINTS: Record<string, string[]> = {
  mists: ["mists", "pandaria"],
  midnight: ["midnight"],
  twow: ["war within", "karezh", "azeroth", "twow"],
  diablo: ["diablo"], // if your pool contains other games too
  raid: ["raid", "boss"],
  ui: ["ui", "interface", "screenshot"],
};

function scorePathForTags(p: string, tags: string[], hints = DEFAULT_TAG_HINTS) {
  const s = p.toLowerCase();
  let score = 0;
  for (const tag of tags) {
    const keys = hints[tag.toLowerCase()];
    if (!keys) continue;
    for (const k of keys) if (s.includes(k)) score++;
  }
  return score;
}

export function pickCoverFor(post: GuidePost, pool: string[], hints = DEFAULT_TAG_HINTS) {
  if (!pool.length) return undefined;

  // Prefer a subpool that matches tags; fallback to full pool
  const scored = pool
    .map((p) => ({ p, score: scorePathForTags(p, post.tags, hints) }))
    .filter((x) => x.score > 0);

  const subpool = scored.length ? scored.map((x) => x.p) : pool;

  // Deterministic per slug
  return pickFromPool(post.slug, subpool);
}
