// src/components/WowheadProvider.tsx
import { useEffect } from "react";

declare global {
  interface Window {
    WH?: { Tooltips?: { refreshLinks?: () => void } };
  }
}

const TOOLTIPS_SRC = import.meta.env.DEV
  ? "/thirdparty/wowhead/tooltips.js"         // optional: proxy in dev if extensions block 3P scripts
  : "https://wow.zamimg.com/js/tooltips.js";

function refreshNow() {
  window.WH?.Tooltips?.refreshLinks?.();
}

export function WowheadProvider() {
  useEffect(() => {
    // If we've already injected, just refresh.
    if (document.getElementById("wowhead-tooltips-js")) {
      queueMicrotask(refreshNow);
      return;
    }

    // 1) Inject the CONFIG as a real global (var whTooltips = {...})
    //    Wowhead's script looks for this BEFORE it runs.
    if (!document.getElementById("wowhead-tooltips-cfg")) {
      const cfg = document.createElement("script");
      cfg.id = "wowhead-tooltips-cfg";
      cfg.type = "text/javascript";
      cfg.text =
        "var whTooltips = " +
        JSON.stringify({
          // keep your own icons/names; just show the tooltip
          colorLinks: false,
          iconizeLinks: false,
          renameLinks: false,
          hide: { sellprice: true },
        }) +
        ";";
      document.head.appendChild(cfg);
    }

    // 2) Load Wowhead's tooltips.js
    const s = document.createElement("script");
    s.id = "wowhead-tooltips-js";
    s.src = TOOLTIPS_SRC;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => setTimeout(refreshNow, 0);
    s.onerror = () => console.warn("[Wowhead] tooltips.js failed to load");
    document.head.appendChild(s);
  }, []);

  return null;
}

// Call this after you render or update a list of links
// eslint-disable-next-line react-refresh/only-export-components
export function refreshWowheadTooltips() {
  setTimeout(refreshNow, 0);
}
