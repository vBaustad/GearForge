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
  tone?: "tip" | "warn";
  title?: string;
  text: string;
};

export type GuideBlock =
  | GuideParagraph
  | GuideCodeBlock
  | GuideImageBlock
  | GuideQuoteBlock
  | GuideCalloutBlock;

export type GuidePost = {
  slug: string;
  imageTitle: string;
  title: string;
  excerpt: string;
  cover?: string;
  tags: string[];
  author?: string;    // optional author
  published?: string; // ISO date the guide was posted
  updated: string;    // ISO date last updated
  content?: GuideBlock[]; // structured content blocks
};
