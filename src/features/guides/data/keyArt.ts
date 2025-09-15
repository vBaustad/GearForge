import { KEY_ART } from "./keyArtManifest";

const LIST: string[] = Array.isArray(KEY_ART) ? KEY_ART : [];
export const KEY_ART_COUNT = LIST.length;

function withBase(url: string): string {
  if (!url) return url;
  if (/^(?:https?:|data:)/.test(url)) return url;
  const base = (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.BASE_URL) || "/";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const u = url.startsWith("/") ? url : `/${url}`;
  return `${b}${u}`;
}

export function pickRandomKeyArt(): string | null {
  if (!LIST.length) return null;
  const idx = Math.floor(Math.random() * LIST.length);
  const url = LIST[idx];
  return url ? encodeURI(withBase(url)) : null;
}

export function pickDeterministicKeyArt(seed: string): string | null {
  if (!LIST.length) return null;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = h % LIST.length;
  const url = LIST[idx];
  return url ? encodeURI(withBase(url)) : null;
}
