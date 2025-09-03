import type { Request, Response } from "express";
import fetch from "node-fetch";

const REGION = process.env.WOW_REGION?.toLowerCase() || "eu"; // "us" | "eu" | "kr" | "tw"
const NAMESPACE = `static-${REGION}`;
const LOCALE = process.env.WOW_LOCALE || (REGION === "eu" ? "en_GB" : "en_US");

let tokenCache: { token: string; exp: number } | null = null;
const iconCache = new Map<number, string>();

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.exp > now + 30_000) return tokenCache.token;

  const id = process.env.BLIZZARD_CLIENT_ID!;
  const secret = process.env.BLIZZARD_CLIENT_SECRET!;
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");

  const r = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`oauth token error: ${r.status} ${text}`);
  }
  const j = await r.json() as { access_token: string; expires_in: number };
  tokenCache = { token: j.access_token, exp: now + (j.expires_in * 1000) };
  return tokenCache.token;
}

/** GET /api/wow/currency/:id/icon -> { iconUrl: string } */
export async function wowCurrencyIcon(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ iconUrl: "" });

    const cached = iconCache.get(id);
    if (cached) return res.json({ iconUrl: cached });

    const token = await getAccessToken();
    const url = `https://${REGION}.api.blizzard.com/data/wow/media/currency/${id}?namespace=${NAMESPACE}&locale=${LOCALE}&access_token=${encodeURIComponent(token)}`;
    const r = await fetch(url);

    if (!r.ok) {
      // Fallback: empty (frontend should tolerate)
      return res.json({ iconUrl: "" });
    }

    const j = await r.json() as { assets?: Array<{ key: string; value: string }> };
    const icon = j.assets?.find(a => a.key === "icon")?.value ?? j.assets?.[0]?.value ?? "";
    iconCache.set(id, icon);
    res.json({ iconUrl: icon });
  } catch {
    res.json({ iconUrl: "" });
  }
}
