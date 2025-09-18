// server/blizzard.ts — server-only helper

/* ──────────────────────────────────────────────────────────────
   Runtime guards & small types
────────────────────────────────────────────────────────────── */

const isBrowser = typeof window !== "undefined";

type IconResult = { iconUrl: string; iconName?: string };

interface OAuthResponse {
  access_token: string;
  expires_in: number; // seconds
}

interface MediaAsset {
  key: string;
  value: string;
}

interface ItemMediaResponse {
  assets?: MediaAsset[];
}

interface WowheadTooltipResponse {
  icon?: string; // e.g. "inv_..."
}

/* ──────────────────────────────────────────────────────────────
   Env reader (runtime-safe for Node/Edge)
────────────────────────────────────────────────────────────── */

function readEnv() {
  if (isBrowser) {
    throw new Error("blizzard.ts was invoked in the browser. This module is server-only.");
  }

  // Edge-safe: process might not exist
  const env: Record<string, string | undefined> =
    typeof process !== "undefined" && typeof process.env !== "undefined"
      ? process.env
      : {};

  const REGION = env.BLIZZARD_API_REGION || "eu";
  const LOCALE = env.BLIZZARD_LOCALE || "en_GB";
  const CLIENT_ID = env.BLIZZARD_CLIENT_ID;
  const CLIENT_SECRET = env.BLIZZARD_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET in server environment.");
  }

  return { REGION, LOCALE, CLIENT_ID, CLIENT_SECRET };
}

/* ──────────────────────────────────────────────────────────────
   Base64 that works in Node and Edge runtimes (no 'any')
────────────────────────────────────────────────────────────── */

type NodeLikeBuffer = {
  from(input: string, encoding: "utf-8"): { toString(encoding: "base64"): string };
};

type GlobalWithBufferAndBtoa = {
  Buffer?: NodeLikeBuffer;
  btoa?: (data: string) => string;
};

function toBase64(s: string): string {
  const g = globalThis as unknown as GlobalWithBufferAndBtoa;

  // Node
  if (typeof g.Buffer !== "undefined") {
    return g.Buffer.from(s, "utf-8").toString("base64");
  }

  // Edge/Web: encode UTF-8 then btoa the binary string
  if (typeof g.btoa === "function") {
    const bytes = new TextEncoder().encode(s);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return g.btoa(binary);
  }

  throw new Error("No base64 encoder available in this runtime.");
}

/* ──────────────────────────────────────────────────────────────
   OAuth token cache
────────────────────────────────────────────────────────────── */

let tokenCache: { token: string; exp: number } = { token: "", exp: 0 };

async function getAccessToken(): Promise<string> {
  const { REGION, CLIENT_ID, CLIENT_SECRET } = readEnv();

  const now = Date.now();
  if (tokenCache.token && now < tokenCache.exp - 60_000) return tokenCache.token;

  const creds = toBase64(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OAuth failed: ${res.status} ${body}`);
  }

  const json = (await res.json()) as OAuthResponse;
  tokenCache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return tokenCache.token;
}

/* ──────────────────────────────────────────────────────────────
   Icon cache
────────────────────────────────────────────────────────────── */

const WEEK = 7 * 24 * 3600 * 1000;
const TWELVE_HOURS = 12 * 3600 * 1000;

const iconCache = new Map<number, { res: IconResult; exp: number }>();

/* ──────────────────────────────────────────────────────────────
   Wowhead fallback (server-side; no CORS issues)
────────────────────────────────────────────────────────────── */

async function getWowheadIconByItemId(itemId: number): Promise<IconResult | null> {
  try {
    const url = `https://www.wowhead.com/tooltip/item/${itemId}`;
    const r = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "gearforge/1.0 (+https://gearforge.app)",
      },
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(`Wowhead tooltip failed: ${r.status} ${body}`);
    }

    const j = (await r.json()) as WowheadTooltipResponse;
    const iconName = j.icon;
    if (!iconName) return null;

    const iconUrl = `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
    return { iconUrl, iconName };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[icon:fallback] item=${itemId} ->`, err);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────
   Public API
────────────────────────────────────────────────────────────── */

export async function getItemIcon(itemId: number): Promise<IconResult> {
  if (isBrowser) {
    throw new Error("getItemIcon() was called from the browser. Move this call to the server.");
  }

  const now = Date.now();
  const hit = iconCache.get(itemId);
  if (hit && now < hit.exp) return hit.res;

  const { REGION, LOCALE } = readEnv();

  // 1) Try Blizzard first
  try {
    const token = await getAccessToken();
    const url = `https://${REGION}.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-${REGION}&locale=${LOCALE}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Item media failed: ${res.status} ${body}`);
    }

    const json = (await res.json()) as ItemMediaResponse;
    const iconAsset = json.assets?.find((a) => a.key === "icon");
    if (!iconAsset?.value) throw new Error(`No icon asset for item ${itemId}`);

    const iconUrl = iconAsset.value;
    const lastSeg = iconUrl.split("/").pop();
    const iconName = lastSeg ? lastSeg.replace(".jpg", "") : undefined;

    const resObj: IconResult = { iconUrl, iconName };
    iconCache.set(itemId, { res: resObj, exp: now + WEEK });
    return resObj;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[icon:blizzard] item=${itemId} ->`, err);
  }

  // 2) Fallback: Wowhead tooltip → zamimg icon
  const fallback = await getWowheadIconByItemId(itemId);
  if (fallback) {
    iconCache.set(itemId, { res: fallback, exp: now + WEEK });
    return fallback;
  }

  // 3) Final fallback: question mark
  const resObj: IconResult = {
    iconUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
    iconName: "inv_misc_questionmark",
  };
  iconCache.set(itemId, { res: resObj, exp: now + TWELVE_HOURS }); // shorter cache
  return resObj;
}

export type { IconResult };
