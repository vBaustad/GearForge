import s from "./components.module.css";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { makeGuidePlaceholder } from "../lib/placeholder";
import { KEY_ART } from "../data/keyArtManifest";
import type { GuidePost } from "../types";

function withBase(url?: string | null): string | null {
  if (!url) return null;
  if (/^(?:https?:|data:)/.test(url)) return url;
  // Vite provides a typed BASE_URL on import.meta.env
  const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const u = url.startsWith("/") ? url : `/${url}`;
  return `${b}${u}`;
}

function categoryClass(tag?: string){
  const t = (tag || "").toLowerCase();
  if (t.includes("mists")) return s["cat-mists"];
  if (t.includes("midnight")) return s["cat-midnight"];
  if (t.includes("macro")) return s["cat-macro"];
  if (t.includes("ui")) return s["cat-ui"];
  if (t.includes("raid")) return s["cat-raid"];
  if (t.includes("wow")) return s["cat-wow"];
  if (t.includes("maxroll")) return s["cat-maxroll"];
  return ""; // default uses --accent
}

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function GuideCard({ post }: { post: GuidePost }) {
  const picked = useMemo(() => {
    if (!Array.isArray(KEY_ART) || KEY_ART.length === 0) return null;
    const idx = hashSeed(post.slug) % KEY_ART.length;
    const url = KEY_ART[idx];
    return url ? encodeURI(url) : null;
  }, [post.slug]);
  const cover = withBase(post.cover) || picked || makeGuidePlaceholder(post.imageTitle, post.tags);
  const mainTag = post.tags[0] ?? "Guide";

  return (
    <Link to={`/guides/${post.slug}`} className={s.card}>
      <img src={cover} alt={post.imageTitle || post.title} className={s.cardImg} />
      <div className={s.cardBody}>
        <div className={`${s.category} ${categoryClass(mainTag)}`}>{mainTag}</div>
        <div className={s.cardTitle}>{post.title}</div>
        <div className={s.meta}>Last updated {new Date(post.updated).toLocaleDateString()}</div>
      </div>
    </Link>
  );
}
