// src/features/guides/types.ts

export type GuideCodeBlock = {
  type: "code";
  label?: string; // e.g., "Macro", "WeakAura", "Script"
  lang?: string;  // e.g., "lua", "txt", "bash"
  content: string;
};

export type GuideParagraph = {
  type: "p";
  text: string;
};

export type GuideImageBlock = {
  type: "img";
  src: string;   // public path or absolute URL
  alt?: string;
  caption?: string;
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

/** NEW: TL;DR box (renders like a callout with fixed “TL;DR” title) */
export type GuideTldrBlock = {
  type: "tldr";
  text: string;
};

/** NEW: Numbered / Bulleted steps */
export type GuideListBlock = {
  type: "ol" | "ul";  // "ol" for steps, "ul" for bullets
  items: string[];
};

/** NEW: Divider line */
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
  | GuideHrBlock;

export type GuidePost = {
  slug: string;
  imageTitle: string;
  title: string;
  subtitle?: string; // optional subtitle (if absent, use excerpt)  
  excerpt: string;
  cover?: string;
  tags: string[];
  author?: string;    // optional author
  published?: string; // ISO date the guide was posted
  updated: string;    // ISO date last updated
  content?: GuideBlock[]; // structured content blocks
};
