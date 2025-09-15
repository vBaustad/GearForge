import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { getItemIcon, getItemMeta } from "./blizzard";

const app = express();
app.use(cors());

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// existing icons route
app.get("/api/wow/item/:id/icon", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const data = await getItemIcon(id);
    res.set("Cache-Control", "s-maxage=604800, stale-while-revalidate=86400");
    res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch icon";
    res.status(500).json({ error: msg });
  }
});

// NEW: icon + rarity
app.get("/api/wow/item/:id/meta", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const data = await getItemMeta(id);
    res.set("Cache-Control", "s-maxage=604800, stale-while-revalidate=86400");
    res.json(data); // { iconUrl, iconName?, rarity? }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch item meta";
    res.status(500).json({ error: msg });
  }
});

// List all key art images under public/images/key_art (recursive)
app.get("/api/key-art", async (_req, res) => {
  try {
    const root = path.join(process.cwd(), "public", "images", "key_art");
    const exts = new Set([".jpg", ".jpeg", ".png", ".webp"]);

    function walk(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const out: string[] = [];
      for (const ent of entries) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          out.push(...walk(abs));
        } else if (ent.isFile()) {
          const ext = path.extname(ent.name).toLowerCase();
          if (exts.has(ext)) {
            const relFromPublic = path.relative(path.join(process.cwd(), "public"), abs);
            // Convert Windows backslashes to URL forward slashes
            const urlPath = "/" + relFromPublic.split(path.sep).join("/");
            out.push(urlPath);
          }
        }
      }
      return out;
    }

    const images = walk(root);
    // Cache headers: 1 day edge cache, allow stale for 1 day
    res.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
    res.json({ images });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list key art";
    res.status(500).json({ error: msg, images: [] });
  }
});

// Extract forum content (Blizzard forums/Discourse) and return simplified HTML
app.get("/api/forum/extract", async (req, res) => {
  try {
    const rawUrl = String(req.query.url || "");
    if (!rawUrl) return res.status(400).json({ error: "Missing url" });
    const u = new URL(rawUrl);
    if (!/^https:$/.test(u.protocol)) return res.status(400).json({ error: "Only https supported" });
    const host = u.hostname.toLowerCase();
    if (!host.endsWith("forums.blizzard.com")) return res.status(400).json({ error: "Host not allowed" });

    // Handle Discourse topic URLs by switching to their JSON endpoint
    let postNumber: number | undefined;
    const segs = u.pathname.split("/").filter(Boolean);
    const last = segs[segs.length - 1];
    if (last && /^\d+$/.test(last)) postNumber = Number(last);

    // Remove trailing numeric segment when building JSON endpoint
    const topicPath = postNumber ? u.pathname.replace(/\/(\d+)$/.exec(u.pathname)?.[0] || "", "") : u.pathname;
    const jsonUrl = new URL(`${u.origin}${topicPath}.json`);

    const r = await fetch(jsonUrl.toString(), { headers: { "User-Agent": "gearforge-forum-proxy" } });
    if (!r.ok) return res.status(502).json({ error: `Upstream ${r.status}` });
    const data = await r.json() as any;

    let chosen: any = null;
    const posts = data?.post_stream?.posts ?? [];
    if (postNumber) {
      chosen = posts.find((p: any) => p?.post_number === postNumber) || null;
    }
    if (!chosen) {
      // Prefer staff reply; else first post
      chosen = posts.find((p: any) => p?.staff) || posts[0] || null;
    }
    const title = data?.title || "";
    const cooked = String(chosen?.cooked || "");
    const author = String(chosen?.username || "");
    const createdAt = String(chosen?.created_at || "");

    function sanitize(html: string): string {
      // Basic hardening: drop scripts and inline handlers; Discourse already sanitizes
      return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/ on[a-z]+="[^"]*"/gi, "")
        .replace(/ on[a-z]+=\'[^\']*\'/gi, "");
    }

    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
    return res.json({ title, author, createdAt, html: sanitize(cooked) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to extract forum content";
    res.status(500).json({ error: msg });
  }
});

const PORT = Number(process.env.API_PORT || 8787);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
