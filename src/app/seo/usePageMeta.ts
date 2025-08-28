import { useEffect } from "react";

function upsert(selector: string, tag: "meta" | "link", attrs: Record<string, string>) {
  let el = document.head.querySelector<Element>(selector);
  if (!el) {
    el = document.createElement(tag);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

export function usePageMeta(opts: {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  robots?: string;
}) {
  useEffect(() => {
    if (opts.title) document.title = opts.title;

    if (opts.description)
      upsert('meta[name="description"]', "meta", { name: "description", content: String(opts.description) });

    if (opts.ogTitle)
      upsert('meta[property="og:title"]', "meta", { property: "og:title", content: String(opts.ogTitle) });

    if (opts.ogDescription)
      upsert('meta[property="og:description"]', "meta", { property: "og:description", content: String(opts.ogDescription) });

    if (opts.ogImage)
      upsert('meta[property="og:image"]', "meta", { property: "og:image", content: String(opts.ogImage) });

    if (opts.canonical)
      upsert('link[rel="canonical"]', "link", { rel: "canonical", href: String(opts.canonical) });

    if (opts.robots)
      upsert('meta[name="robots"]', "meta", { name: "robots", content: String(opts.robots) });
  }, [
    opts.title,
    opts.description,
    opts.ogTitle,
    opts.ogDescription,
    opts.ogImage,
    opts.canonical,
    opts.robots,
  ]);
}
