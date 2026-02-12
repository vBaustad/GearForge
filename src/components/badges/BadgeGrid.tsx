"use client";

import { Award } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "./Badge";

interface BadgeGridProps {
  userId: Id<"users">;
}

export function BadgeGrid({ userId }: BadgeGridProps) {
  const badges = useQuery(api.badges.getByUser, { userId });

  if (badges === undefined) {
    // Loading state
    return (
      <div style={{ marginTop: "var(--space-lg)" }}>
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
            fontSize: "1rem",
          }}
        >
          <Award size={18} />
          Badges
        </h3>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return null; // Don't show section if no badges
  }

  return (
    <div style={{ marginTop: "var(--space-lg)" }}>
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-md)",
          fontSize: "1rem",
          color: "var(--text-secondary)",
        }}
      >
        <Award size={18} />
        Badges
        <span
          className="text-muted"
          style={{ fontWeight: 400, fontSize: "0.875rem" }}
        >
          ({badges.length})
        </span>
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-sm)",
        }}
      >
        {badges.map((badge) => (
          <Badge
            key={badge._id}
            badgeType={badge.badgeType}
            definition={badge.definition}
            awardedAt={badge.awardedAt}
            size="medium"
          />
        ))}
      </div>
    </div>
  );
}
