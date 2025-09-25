// src/app/seo/usePageMeta.ts
import { useEffect } from "react";

type OgType = "website" | "article";

export type UsePageMetaOpts = {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: OgType;
  siteName?: string;
  locale?: string;
  twitterSite?: string;
  twitterCreator?: string;
  jsonLd?: object;
  titleTemplate?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
};

const IS_DEV = !!import.meta.env.DEV;
const RAW_SITE_URL = import.meta.env.VITE_SITE_URL || "";
const DEFAULT_OG = import.meta.env.VITE_OG_IMAGE || "/og-cover.png";
const DEFAULT_TEMPLATE = "%s — GearForge";
const DEFAULT_SITE_NAME = "GearForge";

function resolveSiteOrigin(): string {
  if (RAW_SITE_URL) {
    try {
      return new URL(RAW_SITE_URL).origin.replace(/\/$/, "");
    } catch (e) {
      if (IS_DEV) console.warn("[usePageMeta] Invalid VITE_SITE_URL:", RAW_SITE_URL, e);
    }
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
const SITE_ORIGIN = resolveSiteOrigin();

function absoluteFromSiteOrigin(input?: string, stripSearchHash = false): string | undefined {
  if (!input) return undefined;
  try {
    const base = SITE_ORIGIN || (typeof window !== "undefined" ? window.location.origin : undefined);
    const url = new URL(input, base);
    if (stripSearchHash) {
      url.search = "";
      url.hash = "";
    }
    return url.toString();
  } catch (e) {
    if (IS_DEV) console.warn("[usePageMeta] URL build failed for:", input, e);
    return input;
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
    .forEach(n => n.remove());
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
      const full = titleTemplate.includes("%s") ? titleTemplate.replace("%s", title) : title;
      document.title = full;
      upsertMeta("property", "og:title", full);
      upsertMeta("name", "twitter:title", full);
    }

    // Description
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:description", description);
    upsertMeta("name", "twitter:description", description);

    // Canonical & URL (strip query/hash by default)
    const pathOnly = typeof window !== "undefined" ? window.location.pathname : undefined;
    const canonicalAbs = absoluteFromSiteOrigin(canonical ?? pathOnly, true);
    upsertLinkCanonical(canonicalAbs);
    upsertMeta("property", "og:url", canonicalAbs || undefined);

    // OG/Twitter image (+ alt)
    const imgAbs = absoluteFromSiteOrigin(image || DEFAULT_OG, false);
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
    if (noindex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else {
      upsertMeta("name", "robots", undefined);
    }

    // Article-specific OG tags
    if (ogType === "article") {
      upsertMeta("property", "article:published_time", publishedTime);
      upsertMeta("property", "article:modified_time", modifiedTime);
      upsertMeta("property", "article:section", section);

      // tags
      document
        .querySelectorAll('meta[property="article:tag"][data-dgrp="seo"]')
        .forEach(n => n.remove());
      if (tags?.length) {
        tags.forEach(t => {
          const meta = document.createElement("meta");
          meta.setAttribute("property", "article:tag");
          meta.setAttribute("content", t);
          meta.dataset.dgrp = "seo";
          document.head.appendChild(meta);
        });
      }
    } else {
      ["article:published_time", "article:modified_time", "article:section"].forEach(k =>
        upsertMeta("property", k, undefined)
      );
      document
        .querySelectorAll('meta[property="article:tag"][data-dgrp="seo"]')
        .forEach(n => n.remove());
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
