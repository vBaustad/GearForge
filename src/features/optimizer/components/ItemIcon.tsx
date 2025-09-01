import { useEffect, useState } from "react";
import { fetchItemIcon } from "../services/iconClient";
import styles from "./components.module.css"; // your feature CSS (has .iconStub)

export function ItemIcon({ itemId, alt = "" }: { itemId?: number; alt?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!itemId) { setSrc(null); return; }
    fetchItemIcon(itemId).then(data => {
      if (!alive) return;
      setSrc(data?.iconUrl ?? null);
    });
    return () => { alive = false; };
  }, [itemId]);

  return src ? (
    <img className={styles.iconStub} src={src} alt={alt} width={40} height={40} loading="lazy" />
  ) : (
    <div className={styles.iconStub} aria-hidden />
  );
}
