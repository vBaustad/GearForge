// src/features/guides/types.ts

export type GuideCodeBlock = {
  type: "code";
  label?: string; // e.g., "Macro", "WeakAura", "Script"
  lang?: string;  // e.g., "lua", "txt", "bash"
  content: string;
};

export type GuideParagraph = {
  type: "p";
  /**
   * Supports a tiny inline markup subset:
   * - [label](https://example.com)
   * - **bold**
   * - _italic_
   * - `inline code`
   */
  text: string;
};

export type GuideImageBlock = {
  type: "img";
  src: string;   // public path or absolute URL
  alt?: string;
  caption?: string; // optional figcaption
};

/** NEW: semantic headings */
export type GuideHeadingBlock = {
  type: "h2" | "h3" | "h4";
  text: string;  // plain text; inline links handled via the paragraph style renderer if needed
  id?: string;   // optional anchor id (auto-generated if omitted)
};

export type GuideQuoteBlock = {
  type: "quote";
  source?: "blizzard" | "user" | "other";
  originalUrl?: string;
  html?: string; // optional trusted HTML (we control content)
  text?: string; // plain text fallback
};

export type GuideCalloutBlock = {
  type: "callout";
  tone?: "tip" | "warning";
  title?: string;
  text: string;
};

/** TL;DR box (renders like a callout with fixed “TL;DR” title) */
export type GuideTldrBlock = {
  type: "tldr";
  text: string;
};

/** Numbered / Bulleted steps */
export type GuideListBlock = {
  type: "ol" | "ul" | "steps";  // "ol" for steps, "ul" for bullets
  /**
   * Each item supports the same tiny inline markup:
   * links, **bold**, _italic_, `code`.
   */
  items: string[];
};

/** Divider line */
export type GuideHrBlock = {
  type: "hr";
};

export type GuideBlock =
  | GuideParagraph
  | GuideCodeBlock
  | GuideImageBlock
  | GuideQuoteBlock
  | GuideCalloutBlock
  | GuideTldrBlock 
  | GuideListBlock
  | GuideHrBlock
  | GuideHeadingBlock;

export type GuidePost = {
  slug: string;
  imageTitle: string;
  title: string;
  subtitle?: string;  
  excerpt: string;
  cover?: string;
  tags: string[];
  author?: string;
  published?: string; // ISO
  updated: string;    // ISO
  content?: GuideBlock[];
};
