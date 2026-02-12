"use client";

import { Package, Layers, Calendar } from "lucide-react";

interface BuildStatsProps {
  totalItems: number;
  uniqueItems: number;
  createdAt: number;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDate(timestamp);
}

export function BuildStats({
  totalItems,
  uniqueItems,
  createdAt,
}: BuildStatsProps) {
  const stats = [
    {
      icon: Package,
      label: "Total Items",
      value: totalItems.toLocaleString(),
      description: "placed in this build",
    },
    {
      icon: Layers,
      label: "Unique Items",
      value: uniqueItems.toLocaleString(),
      description: "different decor pieces",
    },
    {
      icon: Calendar,
      label: "Published",
      value: formatRelativeTime(createdAt),
      description: formatDate(createdAt),
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--space-md)",
        marginTop: "var(--space-lg)",
      }}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius)",
              padding: "var(--space-md)",
              textAlign: "center",
            }}
          >
            <Icon
              size={20}
              style={{
                color: "var(--accent)",
                marginBottom: "var(--space-xs)",
              }}
            />
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {stat.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
