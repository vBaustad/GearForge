"use client";

import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export function VerifiedBadge({ size = 16, className = "" }: VerifiedBadgeProps) {
  return (
    <span
      className={`verified-badge ${className}`}
      title="Verified Creator"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#60a5fa", // Blue color for verified
      }}
    >
      <BadgeCheck size={size} fill="currentColor" />
    </span>
  );
}
