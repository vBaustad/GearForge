// src/features/optimizer/hooks/useItemMeta.ts
import { useEffect, useState } from "react";
import { getItemMeta, type ItemMeta } from "../services/itemMeta";

export function useItemMeta(id?: number) {
  const [meta, setMeta] = useState<ItemMeta | undefined>();
  useEffect(() => {
    let on = true;
    if (!id) { setMeta(undefined); return; }
    getItemMeta(id).then(m => { if (on) setMeta(m); }).catch(() => { if (on) setMeta(undefined); });
    return () => { on = false; };
  }, [id]);
  return meta;
}
