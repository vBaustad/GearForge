import express from "express";
import cors from "cors";
import { getItemIcon } from "./blizzard"; // <- your OAuth+Blizzard module

const app = express();
app.use(cors());

// sanity check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// icons
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

const PORT = Number(process.env.API_PORT || 8787); // use a dedicated var (not PORT)
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
