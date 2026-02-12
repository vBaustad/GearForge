"use client";

import {
  Sparkles,
  Palette,
  Heart,
  TrendingUp,
  Users,
  MessageSquare,
  Rocket,
  Star,
} from "lucide-react";

// Icon mapping
const iconMap = {
  sparkles: Sparkles,
  palette: Palette,
  heart: Heart,
  "trending-up": TrendingUp,
  users: Users,
  "message-square": MessageSquare,
  rocket: Rocket,
  star: Star,
};

interface BadgeDefinition {
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement?: string;
}

interface BadgeProps {
  badgeType: string;
  definition: BadgeDefinition;
  awardedAt: number;
  size?: "small" | "medium" | "large";
  showTooltip?: boolean;
}

export function Badge({
  definition,
  size = "medium",
  showTooltip = true,
}: BadgeProps) {
  const Icon = iconMap[definition.icon as keyof typeof iconMap] || Star;

  const sizeStyles = {
    small: { width: 32, height: 32, iconSize: 14 },
    medium: { width: 44, height: 44, iconSize: 20 },
    large: { width: 64, height: 64, iconSize: 28 },
  };

  const { width, height, iconSize } = sizeStyles[size];

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
      }}
      title={showTooltip ? `${definition.name}: ${definition.description}` : undefined}
    >
      <div
        style={{
          width,
          height,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${definition.color}20 0%, ${definition.color}40 100%)`,
          border: `2px solid ${definition.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = `0 4px 12px ${definition.color}40`;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Icon size={iconSize} style={{ color: definition.color }} />
      </div>
    </div>
  );
}

// Tooltip version with popover
export function BadgeWithTooltip({
  definition,
  awardedAt,
  size = "medium",
}: BadgeProps) {
  const Icon = iconMap[definition.icon as keyof typeof iconMap] || Star;

  const sizeStyles = {
    small: { width: 32, height: 32, iconSize: 14 },
    medium: { width: 44, height: 44, iconSize: 20 },
    large: { width: 64, height: 64, iconSize: 28 },
  };

  const { width, height, iconSize } = sizeStyles[size];

  const formattedDate = new Date(awardedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="badge-tooltip-wrapper"
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <div
        className="badge-icon"
        style={{
          width,
          height,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${definition.color}20 0%, ${definition.color}40 100%)`,
          border: `2px solid ${definition.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
        }}
      >
        <Icon size={iconSize} style={{ color: definition.color }} />
      </div>

      {/* CSS-only tooltip */}
      <div
        className="badge-tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "var(--space-sm) var(--space-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          whiteSpace: "nowrap",
          zIndex: 100,
          opacity: 0,
          visibility: "hidden",
          transition: "opacity 0.15s ease, visibility 0.15s ease",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2, color: definition.color }}>
          {definition.name}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          {definition.description}
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 4 }}>
          Earned {formattedDate}
        </div>

        {/* Arrow */}
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid var(--border)",
          }}
        />
      </div>

      <style jsx>{`
        .badge-tooltip-wrapper:hover .badge-icon {
          transform: scale(1.1);
          box-shadow: 0 4px 12px ${definition.color}40;
        }
        .badge-tooltip-wrapper:hover .badge-tooltip {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </div>
  );
}
