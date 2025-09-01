// src/features/optimizer/services/urlCodec.ts
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { SimcPayload } from "../types/simc";

/** Encode a SimcPayload into a compact #d=... URL fragment */
export function encodeToUrlHash(payload: SimcPayload): string {
  const json = JSON.stringify(payload);
  return compressToEncodedURIComponent(json);
}

/** Decode a #d=... URL fragment back into a SimcPayload */
export function decodeFromUrlHash(hash: string): SimcPayload | null {
  const trimmed = hash.replace(/^#?d=/, "").trim();
  if (!trimmed) return null;

  const json = decompressFromEncodedURIComponent(trimmed);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    // validate shape
    if (parsed && typeof parsed === "object" && "simc" in parsed && typeof parsed.simc === "string") {
      return parsed as SimcPayload;
    }
    return null;
  } catch {
    return null;
  }
}
