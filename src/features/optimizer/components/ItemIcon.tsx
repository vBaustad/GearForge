// src/features/optimizer/components/ItemIcon.tsx
import { useEffect, useState } from "react";

type IconData = { iconUrl: string; iconName?: string };

export function ItemIcon({ itemId, alt }: { itemId?: number; alt?: string }) {
  const [icon, setIcon] = useState<IconData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!itemId) { setIcon(null); return; }
      try {
        const r = await fetch(`/api/wow/item/${itemId}/icon`);
        const j = await r.json();
        if (!mounted) return;
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setIcon(j);
        setErr(null);
      } catch (e) {
        if (!mounted) return;
        setErr(e instanceof Error ? e.message : "icon failed");
        setIcon(null);
      }
    }
    load();
    return () => { mounted = false; };
  }, [itemId]);

  const src = icon?.iconUrl
    ?? "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";

  return (
    <img
      src={src}
      alt={alt ?? (icon?.iconName || "Item icon")}
      width={40}
      height={40}
      style={{ borderRadius: 6, background: "#1f2126", border: "1px solid #2a2c31" }}
      title={err ? `Icon error: ${err}` : undefined}
    />
  );
}
