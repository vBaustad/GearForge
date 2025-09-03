// src/features/optimizer/services/urlCodec.ts
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { SimcPayload } from "../types/simc";
import { preparePayloadSimc } from "./simcMinifier";

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

/** Build a full #d=... fragment (short + URL-safe). */
export function encodeToUrlHash(payload: SimcPayload, minify = true): string {
  const slim: SimcPayload = { ...payload, simc: preparePayloadSimc(payload.simc, minify) };
  const json = JSON.stringify(slim);
  const value = compressToEncodedURIComponent(json);
  return `#d=${value}`;
}

/** Decode from "#d=...", "?d=...", raw compressed, or legacy JSON. */
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

/** Full shareable URL (origin + path + #d=...). */
export function buildShareUrl(payload: SimcPayload, baseUrl?: string, minify = true): string {
  const base =
    baseUrl ??
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "/optimizer");
  return `${base}${encodeToUrlHash(payload, minify)}`;
}
