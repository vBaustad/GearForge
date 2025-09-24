// src/components/ads/AdGate.tsx
import { useEffect } from "react";

type Props = { client: string; enabled: boolean };

export function AdGate({ client, enabled }: Props) {
  useEffect(() => {
    const id = "adsbygoogle-loader";
    const existing = document.getElementById(id);

    if (enabled) {
      if (!existing) {
        const s = document.createElement("script");
        s.id = id;
        s.async = true;
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
        s.crossOrigin = "anonymous";
        document.head.appendChild(s);
      }
    } else {
      // remove script + reset queue so Auto ads stop on thin routes
      if (existing) existing.remove();
      if (window.adsbygoogle) window.adsbygoogle = [];
    }
  }, [client, enabled]);

  return null;
}
