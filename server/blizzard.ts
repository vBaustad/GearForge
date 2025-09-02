import "dotenv/config";

const REGION  = process.env.BLIZZARD_API_REGION  || "eu";
const LOCALE  = process.env.BLIZZARD_LOCALE      || "en_GB";
const CLIENT_ID     = process.env.BLIZZARD_CLIENT_ID!;
const CLIENT_SECRET = process.env.BLIZZARD_CLIENT_SECRET!;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Missing BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET");
}

let tokenCache = { token: "", expiresAt: 0 };

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 60_000) return tokenCache.token;

  const res = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return tokenCache.token;
}

/* ---------------- existing icon helper & cache ---------------- */
const iconCache = new Map<number, { iconUrl: string; iconName?: string; expiresAt: number }>();

export async function getItemIcon(itemId: number) {
  const hit = iconCache.get(itemId);
  const now = Date.now();
  if (hit && now < hit.expiresAt) return { iconUrl: hit.iconUrl, iconName: hit.iconName };

  const token = await getAccessToken();
  const url = `https://${REGION}.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-${REGION}&locale=${LOCALE}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Item media failed: ${res.status} ${await res.text()}`);

  const json = (await res.json()) as { assets?: Array<{ key: string; value: string }> };
  const iconAsset = json.assets?.find(a => a.key === "icon");
  if (!iconAsset?.value) throw new Error(`No icon asset for item ${itemId}`);

  const iconUrl = iconAsset.value;
  const iconName = iconUrl.split("/").pop()?.replace(".jpg", "");
  iconCache.set(itemId, { iconUrl, iconName, expiresAt: now + 7 * 24 * 3600 * 1000 });
  return { iconUrl, iconName };
}

/* ---------------- NEW: icon + rarity “meta” helper ---------------- */
export type RarityToken =
  | "poor" | "common" | "uncommon" | "rare" | "epic"
  | "legendary" | "artifact" | "heirloom";

const metaCache = new Map<number, {
  iconUrl: string;
  iconName?: string;
  rarity?: RarityToken;
  expiresAt: number;
}>();

function toRarityToken(qType?: string): RarityToken | undefined {
  if (!qType) return undefined;
  const t = qType.toLowerCase() as RarityToken; // Blizzard returns e.g. "EPIC"
  const allowed: ReadonlyArray<RarityToken> = [
    "poor","common","uncommon","rare","epic","legendary","artifact","heirloom",
  ];
  return allowed.includes(t) ? t : undefined;
}

/** Fetch once: icon URL + item quality → rarity token */
export async function getItemMeta(itemId: number) {
  const hit = metaCache.get(itemId);
  const now = Date.now();
  if (hit && now < hit.expiresAt) {
    const { iconUrl, iconName, rarity } = hit;
    return { iconUrl, iconName, rarity };
  }

  const token = await getAccessToken();

  const mediaUrl = `https://${REGION}.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-${REGION}&locale=${LOCALE}`;
  const itemUrl  = `https://${REGION}.api.blizzard.com/data/wow/item/${itemId}?namespace=static-${REGION}&locale=${LOCALE}`;

  const [mediaRes, itemRes] = await Promise.all([
    fetch(mediaUrl, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(itemUrl,  { headers: { Authorization: `Bearer ${token}` } }),
  ]);

  if (!mediaRes.ok) throw new Error(`Item media failed: ${mediaRes.status} ${await mediaRes.text()}`);
  if (!itemRes.ok)  throw new Error(`Item data failed: ${itemRes.status} ${await itemRes.text()}`);

  const mediaJson = (await mediaRes.json()) as { assets?: Array<{ key: string; value: string }> };
  const itemJson  = (await itemRes.json())  as { quality?: { type?: string } };

  const iconAsset = mediaJson.assets?.find(a => a.key === "icon");
  if (!iconAsset?.value) throw new Error(`No icon asset for item ${itemId}`);

  const iconUrl  = iconAsset.value;
  const iconName = iconUrl.split("/").pop()?.replace(".jpg", "");
  const rarity   = toRarityToken(itemJson.quality?.type);

  metaCache.set(itemId, { iconUrl, iconName, rarity, expiresAt: now + 7 * 24 * 3600 * 1000 });
  return { iconUrl, iconName, rarity };
}
