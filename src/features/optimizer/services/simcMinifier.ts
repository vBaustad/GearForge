// src/features/optimizer/services/simcMinifier.ts

/** Which equipped slots to keep (everything else is noise for the link) */
const EQUIPPED_SLOTS = new Set<string>([
  "head","neck","shoulder","back","chest",
  "wrist","hands","waist","legs","feet",
  "finger1","finger2","trinket1","trinket2",
  "main_hand","off_hand",
]);

/** Default meta keys we allow through verbatim (compact and useful) */
const DEFAULT_META_KEYS: ReadonlyArray<string> = [
  "level","race","region","server","role","professions","spec","talents",
] as const;

export type MinifyOptions = {
  /** Keep the single header comment line with the export timestamp, if present. */
  includeHeaderComment: boolean;
  /** Allowlist of meta keys to keep (`key=value` lines). */
  metaKeys: ReadonlyArray<string>;
  /** Stop parsing when we hit bulky sections like "Gear from Bags". */
  stopAt: ReadonlyArray<RegExp>;
  /** Compact whitespace in kept item lines (saves bytes). */
  compactWhitespace: boolean;
};

/** Very light heuristic to detect the SimC character header comment line. */
function isCharacterHeaderComment(line: string): boolean {
  if (!line.startsWith("#")) return false;
  // Typical: "# Name - Spec - YYYY-MM-DD HH:MM - EU/Realm"
  const clean = line.replace(/^#\s*/, "");
  const parts = clean.split(" - ").map(s => s.trim());
  return parts.length >= 3; // loose on purpose; keeps future variations working
}

/** Minify a SimC text for URL sharing, keeping only what the result page needs. */
export function minifySimcForLink(simcText: string, opts?: Partial<MinifyOptions>): string {
  const options: MinifyOptions = {
    includeHeaderComment: true,
    metaKeys: DEFAULT_META_KEYS,
    stopAt: [/^###\s+Gear from Bags\b/i, /^###\s+Additional Character Info\b/i],
    compactWhitespace: true,
    ...opts,
  };

  const out: string[] = [];
  let keptHeader = false;

  const lines = simcText.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Stop at bulky sections to avoid dragging lots of text into the URL
    if (options.stopAt.some(rx => rx.test(line))) break;

    // 1) Keep a single header comment (for "Exported: ..." timestamp)
    if (!keptHeader && options.includeHeaderComment && isCharacterHeaderComment(line)) {
      out.push(line);
      keptHeader = true;
      continue;
    }

    // Drop other comments
    if (line.startsWith("#")) continue;

    // 2) Keep class assignment (e.g., druid="Ryggsekken")
    if (/^[a-z_]+\s*=\s*".*"$/.test(line)) {
      out.push(line);
      continue;
    }

    // 3) Keep selected meta keys (key=value)
    const eqIdx = line.indexOf("=");
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).toLowerCase();
      if (options.metaKeys.includes(key)) {
        out.push(line);
        continue;
      }
    }

    // 4) Keep equipped item lines only
    const m = line.match(/^([a-z_0-9]+)\s*=\s*(.*)$/i);
    if (m) {
      const slot = m[1].toLowerCase();
      if (EQUIPPED_SLOTS.has(slot)) {
        out.push(options.compactWhitespace ? line.replace(/\s+/g, "") : line);
      }
    }
  }

  // Failsafe: never return empty string (would break decoding); fall back to original
  return out.length > 0 ? out.join("\n") : simcText;
}

/** Wrapper so the caller can switch minification off from one place later. */
export function preparePayloadSimc(simcText: string, enabled = true): string {
  return enabled ? minifySimcForLink(simcText) : simcText;
}
