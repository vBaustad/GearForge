"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NotificationDropdown } from "./NotificationDropdown";

interface NotificationBellProps {
  sessionToken: string;
}

export function NotificationBell({ sessionToken }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = useQuery(api.notifications.getUnreadCount, { sessionToken }) ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="header-nav-link"
        style={{
          position: "relative",
          padding: "var(--space-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              background: "#ef4444",
              borderRadius: 9,
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          sessionToken={sessionToken}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
