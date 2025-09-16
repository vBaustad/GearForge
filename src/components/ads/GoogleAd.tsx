import { useEffect, type CSSProperties } from "react";

const AD_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? "";
export const ADS_ENABLED = AD_CLIENT.length > 0;
const SHOW_PLACEHOLDER = Boolean(import.meta.env.DEV);
const SCRIPT_ID = "adsbygoogle-loader";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function ensureAdScript() {
  if (!ADS_ENABLED || typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

type GoogleAdProps = {
  slot: string;
  format?: string;
  layout?: string;
  layoutKey?: string;
  className?: string;
  style?: CSSProperties;
  responsive?: boolean;
  placeholderLabel?: string;
};

export function GoogleAd({
  slot,
  format = "auto",
  layout,
  layoutKey,
  className,
  style,
  responsive = true,
  placeholderLabel = "AdSense",
}: GoogleAdProps) {
  useEffect(() => {
    if (!ADS_ENABLED) return;
    ensureAdScript();
  }, []);

  useEffect(() => {
    if (!ADS_ENABLED || typeof window === "undefined") return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (err) {
      console.warn("adsbygoogle push failed", err);
    }
  }, [slot, format, layout, layoutKey]);

  if (!ADS_ENABLED) {
    if (!SHOW_PLACEHOLDER) {
      return null;
    }
    const baseMinHeight =
      typeof style?.minHeight === "number" ? Math.max(90, style.minHeight) : 90;

    const placeholderStyle: CSSProperties = {
      minHeight: baseMinHeight,
      borderRadius: 8,
      border: "1px dashed rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.05)",
      color: "#8f95a3",
      fontSize: 12,
      letterSpacing: 0.2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textTransform: "uppercase",
      ...style,
    };

    return (
      <div className={["ad-slot-placeholder", className].filter(Boolean).join(" ")} style={placeholderStyle}>
        {placeholderLabel} slot {slot}
      </div>
    );
  }

  const mergedStyle: CSSProperties = {
    display: responsive ? "block" : undefined,
    minHeight: responsive ? 90 : undefined,
    minWidth: responsive ? 256 : undefined,
    ...style,
  };

  const extraProps: Record<string, string> = {};
  if (layout) extraProps["data-ad-layout"] = layout;
  if (layoutKey) extraProps["data-ad-layout-key"] = layoutKey;
  if (responsive) extraProps["data-full-width-responsive"] = "true";

  return (
    <ins
      className={["adsbygoogle", className].filter(Boolean).join(" ")}
      style={mergedStyle}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      {...extraProps}
    />
  );
}
