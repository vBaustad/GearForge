// src/features/optimizer/hooks/useDisplayRarity.ts
import { useEffect, useState } from "react";
import type { DisplayRarity } from "../services/rarity";
import { rarityFromClassList } from "../services/rarity";

export function useDisplayRarity(
  el: HTMLElement | null,
  deps: unknown[] = []
): DisplayRarity | undefined {
  const [rarity, setRarity] = useState<DisplayRarity | undefined>(() => rarityFromClassList(el ?? null));

  useEffect(() => {
    if (!el) return;

    // Set immediately if already present
    setRarity(rarityFromClassList(el));

    const observer = new MutationObserver(() => {
      setRarity(rarityFromClassList(el));
    });

    observer.observe(el, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, ...deps]);

  return rarity;
}
