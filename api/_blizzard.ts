const REGION  = process.env.BLIZZARD_API_REGION  || "eu";
const LOCALE  = process.env.BLIZZARD_LOCALE      || "en_GB";
const CLIENT_ID     = process.env.BLIZZARD_CLIENT_ID;
const CLIENT_SECRET = process.env.BLIZZARD_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Missing BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET");
}

let tokenCache: { token: string; expiresAt: number } = { token: "", expiresAt: 0 };

type OAuthTokenResponse = { access_token: string; expires_in: number };
type ItemMedia = { assets?: Array<{ key: string; value: string }> };

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 60_000) return tokenCache.token;

  const tokenUrl = `https://${REGION}.battle.net/oauth/token`;
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as OAuthTokenResponse;
  tokenCache = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return tokenCache.token;
}

const iconCache = new Map<number, { iconUrl: string; iconName?: string; expiresAt: number }>();

export async function getItemIcon(itemId: number): Promise<{ iconUrl: string; iconName?: string }> {
  const hit = iconCache.get(itemId);
  const now = Date.now();
  if (hit && now < hit.expiresAt) return { iconUrl: hit.iconUrl, iconName: hit.iconName };

  const token = await getAccessToken();
  const url = `https://${REGION}.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-${REGION}&locale=${LOCALE}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Item media failed: ${res.status} ${await res.text()}`);

  const json = (await res.json()) as ItemMedia;
  const iconAsset = json.assets?.find(a => a.key === "icon");
  if (!iconAsset?.value) throw new Error(`No icon asset for item ${itemId}`);

  const iconUrl = iconAsset.value;
  const iconName = iconUrl.split("/").pop()?.replace(".jpg", "");
  iconCache.set(itemId, { iconUrl, iconName, expiresAt: now + 7 * 24 * 3600 * 1000 });
  return { iconUrl, iconName };
}
