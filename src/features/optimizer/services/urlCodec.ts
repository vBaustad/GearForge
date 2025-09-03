// src/features/optimizer/services/urlCodec.ts
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { SimcPayload } from "../types/simc";

/* ---------- type guards ---------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isSimcPayload(v: unknown): v is SimcPayload {
  if (!isRecord(v)) return false;
  if (typeof v.simc !== "string") return false;
  if ("ceilingIlvl" in v && typeof v.ceilingIlvl !== "number") return false;
  if ("ignoreCeiling" in v && typeof v.ignoreCeiling !== "boolean") return false;
  return true;
}

/* ---------- helpers ---------- */
function stripHash(s: string): string {
  return s.startsWith("#") ? s.slice(1) : s;
}
function safeJSONParse<T>(s: string): T | null {
  try { return JSON.parse(s) as unknown as T; } catch { return null; }
}

/** Remove accidental nesting like "#d=#d=..." or encoded "%23d%3D%23d%3D..." */
function normalizeDValue(v: string): string {
  let s = v.trim();
  const prefixes = ["#d=", "%23d%3D", "d=", "#", "%23"];
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of prefixes) {
      if (s.startsWith(p)) {
        s = s.slice(p.length);
        changed = true;
      }
    }
  }
  return s;
}

/** Decode from "#d=...", "?d=...", raw compressed, or legacy JSON in the hash/query. */
export function decodeFromUrlHash(hashish: string): SimcPayload | null {
  if (!hashish) return null;

  const q = stripHash(hashish);
  const params = new URLSearchParams(q);
  let value = params.get("d");

  if (!value) {
    const m = q.match(/(?:^|[?&])d=([^&]+)/);
    if (m?.[1]) value = m[1];
    else if (!q.includes("&") && !q.includes("=") && q.length > 0) value = q; // raw compressed
  }
  if (!value) return null;

  // tolerate nested/encoded "#d=" prefixes
  value = normalizeDValue(value);

  // Try lz-string first
  const json = decompressFromEncodedURIComponent(value);
  if (json) {
    const parsed = safeJSONParse<unknown>(json);
    return isSimcPayload(parsed) ? parsed : null;
  }

  // Legacy: raw JSON in hash/query
  if (value.startsWith("{") || value.startsWith("%7B")) {
    const parsed = safeJSONParse<unknown>(decodeURIComponent(value));
    return isSimcPayload(parsed) ? parsed : null;
  }
  return null;
}

/** Build a full shareable URL (origin + path + "#d=..."). */
export function buildShareUrl(payload: SimcPayload, baseUrl?: string): string {
  const base =
    baseUrl ??
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "/optimizer");
  return `${base}${encodeToUrlHash(payload)}`;
}

/** Encode a SimcPayload into a compact "#d=..." fragment (no stripping). */
export function encodeToUrlHash(payload: SimcPayload): string {
  const json = JSON.stringify(payload);
  return `#d=${compressToEncodedURIComponent(json)}`;
}
