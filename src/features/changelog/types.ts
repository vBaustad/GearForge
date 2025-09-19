export type ChangeType = "new" | "fix" | "improve" | "data" | "note" | "breaking";

export type ChangeListItem = {
  type?: ChangeType;        // optional if section provides label
  text: string;
  subitems?: string[];      // simple nested bullets
};

export type ChangeBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "code"; lang?: string; code: string }
  | { kind: "section"; title?: string; label?: ChangeType | string; items: ChangeListItem[] };

export type Post = {
  id: string;
  date: string;             // ISO
  title: string;
  tag?: string;             // e.g. "v0.3.1" or "Alpha"
  blocks: ChangeBlock[];    // <— replaces plain items
};
