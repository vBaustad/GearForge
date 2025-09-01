// api/wow/item/[id]/icon.ts
export const config = { runtime: "edge" };

const REGION  = process.env.BLIZZARD_API_REGION  ?? "eu";
const LOCALE  = process.env.BLIZZARD_LOCALE      ?? "en_GB";
const CLIENT_ID     = process.env.BLIZZARD_CLIENT_ID!;
const CLIENT_SECRET = process.env.BLIZZARD_CLIENT_SECRET!;

// base64 for Edge (no Buffer)
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));

async function getAccessToken(): Promise<string> {
  const res = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${b64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json() as { access_token: string; expires_in: number };
  return json.access_token;
}

export default async function handler(req: Request): Promise<Response> {
  // URL format: /api/wow/item/:id/icon
  const parts = new URL(req.url).pathname.split("/");
  const idStr = parts[parts.length - 2];
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return new Response(JSON.stringify({ error: "Invalid id" }), { status: 400 });
  }

  try {
    const token = await getAccessToken();
    const api = `https://${REGION}.api.blizzard.com/data/wow/media/item/${id}?namespace=static-${REGION}&locale=${LOCALE}`;
    const r = await fetch(api, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `Item media failed: ${r.status} ${await r.text()}` }), { status: 500 });
    }
    const data = await r.json() as { assets?: Array<{ key: string; value: string }> };
    const icon = data.assets?.find(a => a.key === "icon")?.value;
    if (!icon) return new Response(JSON.stringify({ error: `No icon asset for item ${id}` }), { status: 404 });

    const body = { iconUrl: icon, iconName: icon.split("/").pop()?.replace(".jpg", "") };
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
