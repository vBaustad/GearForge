"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Heart, Eye, ExternalLink } from "lucide-react";
import "./embed.css";

const CATEGORY_LABELS: Record<string, string> = {
  bedroom: "Bedroom",
  living_room: "Living Room",
  kitchen: "Kitchen",
  garden: "Garden",
  tavern: "Tavern",
  throne_room: "Throne Room",
  workshop: "Workshop",
  library: "Library",
  exterior: "Exterior",
  other: "Other",
};

interface EmbedWidgetProps {
  id: string;
  theme: string;
}

export function EmbedWidget({ id, theme }: EmbedWidgetProps) {
  const isValidId = id && id !== "undefined" && id !== "null";
  const design = useQuery(
    api.creations.getById,
    isValidId ? { id: id as Id<"creations"> } : "skip"
  );

  const isDark = theme === "dark";

  if (!isValidId || design === null) {
    return (
      <div className={`embed-widget ${isDark ? "dark" : "light"}`}>
        <div className="embed-error">Design not found</div>
      </div>
    );
  }

  if (design === undefined) {
    return (
      <div className={`embed-widget ${isDark ? "dark" : "light"}`}>
        <div className="embed-loading">Loading...</div>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[design.category] || design.category;
  const designUrl = `https://gearforge.io/design/${id}`;

  return (
    <div className={`embed-widget ${isDark ? "dark" : "light"}`}>
      <a
        href={designUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="embed-card"
      >
        {/* Thumbnail */}
        <div className="embed-thumbnail">
          {design.imageUrls && design.imageUrls[0] ? (
            <img src={design.imageUrls[0]} alt={design.title} />
          ) : (
            <div className="embed-placeholder">GF</div>
          )}
        </div>

        {/* Content */}
        <div className="embed-content">
          <span className="embed-badge">{categoryLabel}</span>
          <h3 className="embed-title">{design.title}</h3>
          <p className="embed-creator">by {design.creatorName}</p>
          <div className="embed-stats">
            <span>
              <Heart size={14} />
              {design.likeCount}
            </span>
            <span>
              <Eye size={14} />
              {design.viewCount}
            </span>
          </div>
        </div>

        {/* Branding */}
        <div className="embed-branding">
          <div className="embed-logo">G</div>
          <span className="embed-domain">gearforge.io</span>
          <ExternalLink size={12} className="embed-external" />
        </div>
      </a>
    </div>
  );
}
