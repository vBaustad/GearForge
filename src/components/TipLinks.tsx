"use client";

import { Coffee, Heart, DollarSign, Users } from "lucide-react";

interface TipLinksProps {
  tipLinks?: {
    buymeacoffee?: string;
    kofi?: string;
    paypal?: string;
    patreon?: string;
  };
}

const platformConfig = {
  buymeacoffee: {
    label: "Buy Me a Coffee",
    color: "#FFDD00",
    bgColor: "rgba(255, 221, 0, 0.15)",
    textColor: "#1a1a1a",
    icon: Coffee,
  },
  kofi: {
    label: "Ko-fi",
    color: "#FF5E5B",
    bgColor: "rgba(255, 94, 91, 0.15)",
    textColor: "#fff",
    icon: Heart,
  },
  paypal: {
    label: "PayPal",
    color: "#003087",
    bgColor: "rgba(0, 48, 135, 0.15)",
    textColor: "#fff",
    icon: DollarSign,
  },
  patreon: {
    label: "Patreon",
    color: "#FF424D",
    bgColor: "rgba(255, 66, 77, 0.15)",
    textColor: "#fff",
    icon: Users,
  },
};

export function TipLinks({ tipLinks }: TipLinksProps) {
  if (!tipLinks) return null;

  const activeLinks = Object.entries(tipLinks).filter(
    ([, url]) => url && url.trim() !== ""
  );

  if (activeLinks.length === 0) return null;

  return (
    <div style={{ marginTop: "var(--space-lg)" }}>
      <h3
        style={{
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          marginBottom: "var(--space-sm)",
          fontWeight: 500,
        }}
      >
        Support this creator
      </h3>
      <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        {activeLinks.map(([platform, url]) => {
          const config = platformConfig[platform as keyof typeof platformConfig];
          if (!config || !url) return null;

          const Icon = config.icon;

          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: config.color,
                borderRadius: "var(--radius-sm)",
                color: config.textColor,
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Icon size={16} />
              <span>{config.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
