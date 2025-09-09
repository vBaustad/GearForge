import { useEffect } from "react";

type OgType = "website" | "article";

export type UsePageMetaOpts = {
  /** Page title without site suffix (we’ll template it) */
  title?: string;
  /** Plain text description (150–160 chars is ideal) */
  description?: string;
  /** Absolute or relative URL to an OG image */
  image?: string;
  /** Alt text for OG/Twitter image */
  imageAlt?: string;
  /** Absolute or relative canonical URL; defaults to current full href */
  canonical?: string;
  /** Set robots to noindex,nofollow */
  noindex?: boolean;
  /** Open Graph type; default "website" */
  ogType?: OgType;
  /** OG site name (default "GearForge") */
  siteName?: string;
  /** OG locale, e.g. "en_US" or "nb_NO" */
  locale?: string;

  /** Twitter handle of the site (e.g. "@gearforge") */
  twitterSite?: string;
  /** Twitter handle of the author/creator */
  twitterCreator?: string;

  /** Optional JSON-LD object */
  jsonLd?: object;
  /** Title template; %s replaced by title */
  titleTemplate?: string; // e.g. "%s — GearForge"

  /** Article-only fields (used when ogType === "article") */
  publishedTime?: string; // ISO 8601
  modifiedTime?: string;  // ISO 8601
  section?: string;
  tags?: string[];        // e.g., ["WoW","Mythic+","Vault"]
};

const SITE_URL = import.meta.env.VITE_SITE_URL || "";
const DEFAULT_OG = import.meta.env.VITE_OG_IMAGE || "/og-cover.png";
const DEFAULT_TEMPLATE = "%s — GearForge";
const DEFAULT_SITE_NAME = "GearForge";

function abs(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const base =
      SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
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
    if (el?.dataset.dgrp === "seo") el.remove();
    return;
  }
  if (el) {
    el.setAttribute("content", content);
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
    imageAlt,
    canonical,
    noindex,
    ogType = "website",
    siteName = DEFAULT_SITE_NAME,
    locale,
    twitterSite,
    twitterCreator,
    jsonLd,
    titleTemplate = DEFAULT_TEMPLATE,
    publishedTime,
    modifiedTime,
    section,
    tags,
  } = opts;

  useEffect(() => {
    if (typeof document === "undefined") return;

    // Title (+ template)
    if (title) {
      const full = titleTemplate.includes("%s")
        ? titleTemplate.replace("%s", title)
        : title;
      document.title = full;
      upsertMeta("property", "og:title", full);
      upsertMeta("name", "twitter:title", full);
    }

    // Description
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:description", description);
    upsertMeta("name", "twitter:description", description);

    // Canonical & URL — default to the full current URL
    const currentHref =
      typeof window !== "undefined" ? window.location.href : undefined;
    const canonicalAbs = abs(canonical ?? currentHref);
    upsertLinkCanonical(canonicalAbs);
    upsertMeta("property", "og:url", canonicalAbs || undefined);

    // OG/Twitter image (+ alt)
    const imgAbs = abs(image || DEFAULT_OG);
    upsertMeta("property", "og:image", imgAbs);
    upsertMeta("property", "og:image:secure_url", imgAbs);
    upsertMeta("name", "twitter:image", imgAbs);
    upsertMeta("property", "og:image:alt", imageAlt);
    upsertMeta("name", "twitter:image:alt", imageAlt);

    // OG basics
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:site_name", siteName);
    upsertMeta("property", "og:locale", locale);

    // Twitter
    upsertMeta("name", "twitter:card", imgAbs ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:site", twitterSite);
    upsertMeta("name", "twitter:creator", twitterCreator);

    // robots
    if (noindex) upsertMeta("name", "robots", "noindex, nofollow");
    else upsertMeta("name", "robots", undefined);

    // Article-specific OG tags
    if (ogType === "article") {
      upsertMeta("property", "article:published_time", publishedTime);
      upsertMeta("property", "article:modified_time", modifiedTime);
      upsertMeta("property", "article:section", section);
      if (tags?.length) {
        // remove previous tags added by us
        document
          .querySelectorAll('meta[property="article:tag"][data-dgrp="seo"]')
          .forEach((n) => n.remove());
        tags.forEach((t) => {
          const meta = document.createElement("meta");
          meta.setAttribute("property", "article:tag");
          meta.setAttribute("content", t);
          meta.dataset.dgrp = "seo";
          document.head.appendChild(meta);
        });
      } else {
        document
          .querySelectorAll('meta[property="article:tag"][data-dgrp="seo"]')
          .forEach((n) => n.remove());
      }
    } else {
      // Clean up article tags if we switch types
      ["article:published_time","article:modified_time","article:section"]
        .forEach((k) => upsertMeta("property", k, undefined));
      document
        .querySelectorAll('meta[property="article:tag"][data-dgrp="seo"]')
        .forEach((n) => n.remove());
    }

    // JSON-LD
    upsertJsonLd(jsonLd);
  }, [
    title, description, image, imageAlt,
    canonical, noindex, ogType, siteName, locale,
    twitterSite, twitterCreator, jsonLd, titleTemplate,
    publishedTime, modifiedTime, section, tags?.join("|"),
  ]);
}
