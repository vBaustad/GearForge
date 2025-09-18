// server/index.ts
import express from "express";
import "dotenv/config";
import cors from "cors";
import { getItemIcon } from "./blizzard";
import { getItemMeta, type ItemMetaOpts } from "./itemMeta"; // ← server file

const app = express();
app.use(cors());

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// icons (kept for existing callers)
app.get("/api/wow/item/:id/icon", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const data = await getItemIcon(id);
    res.set("Cache-Control", "s-maxage=604800, stale-while-revalidate=86400");
    res.json(data); // { iconUrl, iconName? }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch icon";
    console.error("icon route error:", e);
    res.status(500).json({ error: msg });
  }
});

// meta (currently: icon only; rarity handled client-side via Wowhead tooltip)
app.get("/api/wow/item/:id/meta", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  // kept for signature stability (server ignores for icons)
  const bonusParam = typeof req.query.bonus === "string" ? req.query.bonus : "";
  const bonusIds = bonusParam
    ? bonusParam.split(":").map((s) => Number(s)).filter((n) => Number.isFinite(n))
    : undefined;

  const levelRaw = Number(req.query.level);
  const level = Number.isFinite(levelRaw) ? levelRaw : undefined;

  const context = typeof req.query.context === "string" ? req.query.context : undefined;

  const opts: ItemMetaOpts = { bonusIds, level, context };

  try {
    const data = await getItemMeta(id, opts);
    // icons are variant-agnostic; cache like /icon
    res.set("Cache-Control", "s-maxage=604800, stale-while-revalidate=86400");
    res.json(data); // { iconUrl, iconName }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch item meta";
    console.error("meta route error:", e);
    res.status(500).json({ error: msg });
  }
});

const PORT = Number(process.env.API_PORT || 8787);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
