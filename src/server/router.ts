import { Router } from "express";
import { getItemIcon } from "./blizzard";

export const api = Router();

api.get("/wow/item/:id/icon", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: `Invalid id: ${req.params.id}` });
  }
  try {
    const data = await getItemIcon(id);
    return res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});
