// src/components/ads/GoogleAd.tsx
import { useEffect, type CSSProperties } from "react";

const AD_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? "";
export const ADS_ENABLED = AD_CLIENT.length > 0;

// Show a lightweight placeholder frame in dev so layout doesn't collapse
const SHOW_PLACEHOLDER = Boolean(import.meta.env.DEV);

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type GoogleAdProps = {
  /** Your AdSense ad slot id (string or numeric string) */
  slot: string;
  /** Set false to hard-disable this instance (belt & suspenders with route gating) */
  enabled?: boolean;
  /** AdSense format; "auto" is typical for responsive display */
  format?: string;
  /** Optional layout for in-feed/in-article */
  layout?: string;
  /** Optional layout key for in-feed */
  layoutKey?: string;
  /** Pass through styling/className */
  className?: string;
  style?: CSSProperties;
  /** Whether to mark the ad as full-width responsive */
  responsive?: boolean;
  /** Dev-only placeholder label */
  placeholderLabel?: string;
};

export function GoogleAd({
  slot,
  enabled = true,
  format = "auto",
  layout,
  layoutKey,
  className,
  style,
  responsive = true,
  placeholderLabel = "AdSense",
}: GoogleAdProps) {
  // Push a new ad request when props change and ads are enabled for this instance
  useEffect(() => {
    if (!ADS_ENABLED || !enabled || typeof window === "undefined") return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (err) {
      // Silently ignore; AdSense can throw while booting or if script is absent
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("adsbygoogle push failed", err);
      }
    }
  }, [enabled, slot, format, layout, layoutKey]);

  // If ads are globally off or this instance is disabled, render nothing (or a dev placeholder)
  if (!ADS_ENABLED || !enabled) {
    if (!SHOW_PLACEHOLDER) return null;

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
      <div
        className={["ad-slot-placeholder", className].filter(Boolean).join(" ")}
        style={placeholderStyle}
      >
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

  // In dev, mark as test to avoid invalid traffic
  const devProps = import.meta.env.DEV ? { "data-adtest": "on" } : {};

  return (
    <ins
      className={["adsbygoogle", className].filter(Boolean).join(" ")}
      style={mergedStyle}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      {...extraProps}
      {...devProps}
    />
  );
}

export default GoogleAd;
