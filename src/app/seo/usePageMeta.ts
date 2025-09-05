import { useEffect } from "react";

type OgType = "website" | "article";

export type UsePageMetaOpts = {
  /** Page title without site suffix (we’ll template it) */
  title?: string;
  /** Plain text description (150–160 chars is ideal) */
  description?: string;
  /** Absolute or relative URL to an OG image */
  image?: string;
  /** Absolute or relative canonical URL; defaults to current pathname */
  canonical?: string;
  /** Set robots to noindex,nofollow */
  noindex?: boolean;
  /** Open Graph type; default "website" */
  ogType?: OgType;
  /** Optional JSON-LD object */
  jsonLd?: object;
  /** Title template; %s replaced by title */
  titleTemplate?: string; // e.g. "%s — GearForge"
};

const SITE_URL = import.meta.env.VITE_SITE_URL || "";
const DEFAULT_OG = import.meta.env.VITE_OG_IMAGE || "/og-cover.png";
const DEFAULT_TEMPLATE = "%s — GearForge";

function abs(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const base = SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function selectMeta(attr: "name" | "property", key: string) {
  return document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
}

function upsertMeta(attr: "name" | "property", key: string, content?: string) {
  if (typeof document === "undefined") return;
  const el = selectMeta(attr, key);
  if (!content) {
    // Only clear if we previously managed it
    if (el?.dataset.dgrp === "seo") el.remove();
    return;
  }
  if (el) {
    el.setAttribute("content", content);
    // keep existing element (may be from index.html)
    return;
  }
  const meta = document.createElement("meta");
  meta.setAttribute(attr, key);
  meta.setAttribute("content", content);
  meta.dataset.dgrp = "seo";
  document.head.appendChild(meta);
}

function upsertLinkCanonical(href?: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    if (el?.dataset.dgrp === "seo") el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    el.dataset.dgrp = "seo";
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(data?: object) {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll('script[type="application/ld+json"][data-dgrp="seo"]')
    .forEach((n) => n.remove());
  if (!data) return;
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.dataset.dgrp = "seo";
  el.text = JSON.stringify(data);
  document.head.appendChild(el);
}

export function usePageMeta(opts: UsePageMetaOpts) {
  const {
    title,
    description,
    image,
    canonical,
    noindex,
    ogType = "website",
    jsonLd,
    titleTemplate = DEFAULT_TEMPLATE,
  } = opts;

  useEffect(() => {
    if (typeof document === "undefined") return;

    // Title (+ template)
    if (title) {
      const full = titleTemplate.replace("%s", title);
      document.title = full;
      upsertMeta("property", "og:title", full);
      upsertMeta("name", "twitter:title", full);
    }

    // Description
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:description", description);
    upsertMeta("name", "twitter:description", description);

    // Canonical & URL (absolute)
    const canonicalAbs = abs(canonical ?? (typeof window !== "undefined" ? window.location.pathname : "/"));
    upsertLinkCanonical(canonicalAbs);
    upsertMeta("property", "og:url", canonicalAbs || undefined);

    // OG image / Twitter image (absolute, with fallback)
    const imgAbs = abs(image || DEFAULT_OG);
    upsertMeta("property", "og:image", imgAbs);
    upsertMeta("name", "twitter:image", imgAbs);

    // OG type + site_name (static site name; override if needed)
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:site_name", "GearForge");

    // Twitter card type
    upsertMeta("name", "twitter:card", imgAbs ? "summary_large_image" : "summary");

    // robots
    if (noindex) upsertMeta("name", "robots", "noindex, nofollow");
    else upsertMeta("name", "robots", undefined);

    // JSON-LD
    upsertJsonLd(jsonLd);
  }, [title, description, image, canonical, noindex, ogType, jsonLd, titleTemplate]);
}
