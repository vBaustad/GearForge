"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DesignCard } from "@/components/DesignCard";
import { Sparkles } from "lucide-react";

interface RelatedBuildsProps {
  currentDesignId: Id<"creations">;
  creatorId: Id<"users">;
  category: string;
  creatorName: string;
}

export function RelatedBuilds({
  currentDesignId,
  creatorId,
  category,
  creatorName,
}: RelatedBuildsProps) {
  // Get more builds from the same creator
  const creatorBuilds = useQuery(api.creations.getByCreator, {
    creatorId,
  });

  // Get more builds in the same category
  const categoryBuilds = useQuery(api.creations.list, {
    category: category as "bedroom" | "living_room" | "kitchen" | "garden" | "tavern" | "throne_room" | "workshop" | "library" | "exterior" | "other",
    limit: 6,
  });

  // Filter out current design and combine
  const otherCreatorBuilds = (creatorBuilds || [])
    .filter((b) => b._id !== currentDesignId)
    .slice(0, 3);

  const otherCategoryBuilds = (categoryBuilds || [])
    .filter((b) => b._id !== currentDesignId && b.creatorId !== creatorId)
    .slice(0, 3);

  const hasRelated = otherCreatorBuilds.length > 0 || otherCategoryBuilds.length > 0;

  if (!hasRelated) {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        marginTop: "var(--space-xl)",
        padding: "var(--space-lg)",
      }}
    >
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
          fontSize: "1.125rem",
          fontWeight: 600,
        }}
      >
        <Sparkles size={20} style={{ color: "var(--accent)" }} />
        Related Builds
      </h3>

      {/* More from this creator */}
      {otherCreatorBuilds.length > 0 && (
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <h4
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              marginBottom: "var(--space-md)",
            }}
          >
            More from {creatorName.split("#")[0]}
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "var(--space-md)",
            }}
          >
            {otherCreatorBuilds.map((build) => (
              <DesignCard
                key={build._id}
                id={build._id}
                title={build.title}
                thumbnailUrl={build.thumbnailUrl}
                category={build.category}
                creatorName={creatorName.split("#")[0]}
                likeCount={build.likeCount}
                viewCount={build.viewCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Similar builds in category */}
      {otherCategoryBuilds.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              marginBottom: "var(--space-md)",
            }}
          >
            Similar {category.replace("_", " ")} builds
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "var(--space-md)",
            }}
          >
            {otherCategoryBuilds.map((build) => (
              <DesignCard
                key={build._id}
                id={build._id}
                title={build.title}
                thumbnailUrl={build.thumbnailUrl}
                category={build.category}
                creatorName={build.creatorName}
                likeCount={build.likeCount}
                viewCount={build.viewCount}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
