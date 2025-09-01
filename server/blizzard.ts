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
