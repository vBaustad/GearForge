import { getItemIcon } from "../../../_blizzard";

type Req = { query: { id?: string | string[] } };
type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

export default async function handler(req: Req, res: Res) {
  const raw = req.query.id;
  const id = typeof raw === "string" ? Number(raw) : Number(raw?.[0]);

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const data = await getItemIcon(id);
    res.setHeader("Cache-Control", "s-maxage=604800, stale-while-revalidate=86400");
    res.status(200).json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch icon";
    res.status(500).json({ error: msg });
  }
}
