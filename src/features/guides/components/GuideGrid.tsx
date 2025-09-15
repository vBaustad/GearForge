import s from "./components.module.css";
import { GuideCard } from "./GuideCard";
import { POSTS } from "../data/posts";

type Props = {
  classSlug?: string | null;
  specSlug?: string | null;
  showEmptyMessage?: boolean;
};

function normalizeTags(tags: string[] = []): Set<string> {
  const flat: string[] = [];
  for (const t of tags) {
    const v = (t || "").toLowerCase().trim();
    if (!v) continue;
    flat.push(v);
    // Accept prefixes like class:dk, spec:blood
    const parts = v.split(":");
    if (parts.length === 2) flat.push(parts[1]);
  }
  return new Set(flat);
}

function matchesClassSpec(postTags: string[] = [], classSlug?: string | null, specSlug?: string | null): boolean {
  if (!classSlug && !specSlug) return true;
  const tags = normalizeTags(postTags);
  // Class logic
  if (classSlug) {
    const c = classSlug.toLowerCase();
    const classOk = tags.has(c) || tags.has(`class:${c}`) || Array.from(tags).some(t => t === `spec:${c}` || t.startsWith(`${c}-`));
    if (!classOk) return false;
  }
  // Spec logic
  if (specSlug) {
    const s = specSlug.toLowerCase();
    const specOk = tags.has(s) || tags.has(`spec:${s}`) || Array.from(tags).some(t => t.endsWith(`-${s}`));
    if (!specOk) return false;
  }
  return true;
}

export function GuideGrid({ classSlug = null, specSlug = null}: Props) {
  const items = POSTS.filter(p => matchesClassSpec(p.tags, classSlug, specSlug));
  return (
    <div>
      <div className={s.cardsGrid}>
        {items.map(p => <GuideCard key={p.slug} post={p} />)}
      </div>
    </div>
  );
}
