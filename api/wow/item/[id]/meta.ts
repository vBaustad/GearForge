export const config = { runtime: "edge" };

const REGION  = process.env.BLIZZARD_API_REGION  ?? "eu";
const LOCALE  = process.env.BLIZZARD_LOCALE      ?? "en_GB";
const CLIENT_ID     = process.env.BLIZZARD_CLIENT_ID!;
const CLIENT_SECRET = process.env.BLIZZARD_CLIENT_SECRET!;

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));

let tokenCache: { token: string; exp: number } = { token: "", exp: 0 };
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.exp - 60_000) return tokenCache.token;
  const res = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${b64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return tokenCache.token;
}

type RarityToken =
  | "poor" | "common" | "uncommon" | "rare" | "epic"
  | "legendary" | "artifact" | "heirloom";
const toRarityToken = (q?: string): RarityToken | undefined => {
  const t = q?.toLowerCase();
  if (!t) return undefined;
  return ["poor","common","uncommon","rare","epic","legendary","artifact","heirloom"]
    .includes(t) ? (t as RarityToken) : undefined;
};

const metaCache = new Map<number, { iconUrl: string; iconName?: string; rarity?: RarityToken; exp: number }>();

export default async function handler(req: Request): Promise<Response> {
  const parts = new URL(req.url).pathname.split("/");
  const idStr = parts[parts.length - 2];
  const id = Number(idStr);
  if (!Number.isFinite(id)) return new Response(JSON.stringify({ error: "Invalid id" }), { status: 400 });

  const now = Date.now();
  const hit = metaCache.get(id);
  if (hit && now < hit.exp) {
    return new Response(JSON.stringify({ iconUrl: hit.iconUrl, iconName: hit.iconName, rarity: hit.rarity }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "s-maxage=604800, stale-while-revalidate=86400" },
    });
  }

  try {
    const token = await getAccessToken();

    const mediaUrl = `https://${REGION}.api.blizzard.com/data/wow/media/item/${id}?namespace=static-${REGION}&locale=${LOCALE}`;
    const itemUrl  = `https://${REGION}.api.blizzard.com/data/wow/item/${id}?namespace=static-${REGION}&locale=${LOCALE}`;

    const [mediaRes, itemRes] = await Promise.all([
      fetch(mediaUrl, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(itemUrl,  { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (!mediaRes.ok) return new Response(JSON.stringify({ error: `Item media failed: ${mediaRes.status} ${await mediaRes.text()}` }), { status: 500 });
    if (!itemRes.ok)  return new Response(JSON.stringify({ error: `Item data failed: ${itemRes.status} ${await itemRes.text()}` }), { status: 500 });

    const mediaJson = (await mediaRes.json()) as { assets?: Array<{ key: string; value: string }> };
    const itemJson  = (await itemRes.json())  as { quality?: { type?: string } };

    const icon = mediaJson.assets?.find(a => a.key === "icon")?.value;
    if (!icon) return new Response(JSON.stringify({ error: `No icon asset for item ${id}` }), { status: 404 });

    const rarity = toRarityToken(itemJson.quality?.type);
    const body = { iconUrl: icon, iconName: icon.split("/").pop()?.replace(".jpg", ""), rarity };

    metaCache.set(id, { ...body, exp: now + 7 * 24 * 3600 * 1000 });

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown failure";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
