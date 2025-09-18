import { useEffect, useMemo, useState } from "react";
import { getItemMeta, type ItemMeta, type ItemMetaOpts } from "../services/itemMeta";

export function useItemMeta(id?: number, opts: ItemMetaOpts = {}) {
  const [meta, setMeta] = useState<ItemMeta | undefined>();

  // Stable variant key so we only refetch when the variant actually changes.
  const key = useMemo(() => {
    if (!id) return "";
    return JSON.stringify({
      id,
      b: opts.bonusIds ?? [],
      l: typeof opts.level === "number" ? opts.level : undefined,
      c: opts.context,
    });
  }, [id, opts.bonusIds, opts.level, opts.context]);

  useEffect(() => {
    let on = true;
    if (!id) { setMeta(undefined); return; }
    (async () => {
      try {
        const m = await getItemMeta(id, opts);
        if (on) setMeta(m);
      } catch {
        if (on) setMeta(undefined);
      }
    })();
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // fetch only when the variant key changes

  return meta;
}
