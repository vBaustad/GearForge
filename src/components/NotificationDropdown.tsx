"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageSquare,
  Reply,
  UserPlus,
  Upload,
  ThumbsUp,
  Award,
  Check,
  User,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NotificationDropdownProps {
  sessionToken: string;
  onClose: () => void;
}

const notificationConfig = {
  like: {
    icon: Heart,
    color: "#ef4444",
    getMessage: (actorName: string, groupCount?: number) =>
      groupCount && groupCount > 1
        ? `${actorName} and ${groupCount - 1} others liked your design`
        : `${actorName} liked your design`,
  },
  comment: {
    icon: MessageSquare,
    color: "#3b82f6",
    getMessage: (actorName: string) => `${actorName} commented on your design`,
  },
  reply: {
    icon: Reply,
    color: "#8b5cf6",
    getMessage: (actorName: string) => `${actorName} replied to your comment`,
  },
  follow: {
    icon: UserPlus,
    color: "#22c55e",
    getMessage: (actorName: string, groupCount?: number) =>
      groupCount && groupCount > 1
        ? `${actorName} and ${groupCount - 1} others followed you`
        : `${actorName} followed you`,
  },
  new_design: {
    icon: Upload,
    color: "#f59e0b",
    getMessage: (actorName: string) => `${actorName} posted a new design`,
  },
  comment_like: {
    icon: ThumbsUp,
    color: "#ec4899",
    getMessage: (actorName: string, groupCount?: number) =>
      groupCount && groupCount > 1
        ? `${actorName} and ${groupCount - 1} others liked your comment`
        : `${actorName} liked your comment`,
  },
  badge_earned: {
    icon: Award,
    color: "#eab308",
    getMessage: () => "You earned a new badge!",
  },
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return new Date(timestamp).toLocaleDateString();
}

export function NotificationDropdown({ sessionToken, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  const notifications = useQuery(api.notifications.getForUser, {
    sessionToken,
    limit: 10,
  });

  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const handleNotificationClick = async (notification: NonNullable<typeof notifications>[0]) => {
    try {
      setActionError(null);

      // Mark as read
      if (!notification.read) {
        await markRead({ sessionToken, notificationId: notification._id });
      }

      // Navigate to appropriate page
      if (notification.creationId) {
        router.push(`/design/${notification.creationId}`);
      } else if (notification.type === "follow" && notification.actorId) {
        router.push(`/user/${notification.actorId}`);
      } else if (notification.type === "badge_earned") {
        router.push("/settings");
      }

      onClose();
    } catch (error) {
      console.error("Failed to handle notification click:", error);
      setActionError("Something went wrong. Please try again.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionError(null);
      await markAllRead({ sessionToken });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      setActionError("Failed to mark notifications as read.");
    }
  };

  const isLoading = notifications === undefined;
  const hasUnread = notifications?.some((n) => !n.read);

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + var(--space-sm))",
        right: 0,
        width: 360,
        maxHeight: 480,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "var(--space-md)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Notifications</h3>
        {hasUnread && !actionError && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-ghost"
            style={{
              padding: "var(--space-xs) var(--space-sm)",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
            }}
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* Action error banner */}
      {actionError && (
        <div
          style={{
            padding: "var(--space-sm) var(--space-md)",
            background: "rgba(239, 68, 68, 0.1)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            fontSize: "0.75rem",
            color: "#ef4444",
          }}
        >
          <AlertTriangle size={12} />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "var(--space-lg)", textAlign: "center" }}>
            <div className="skeleton" style={{ height: 60, marginBottom: "var(--space-sm)" }} />
            <div className="skeleton" style={{ height: 60, marginBottom: "var(--space-sm)" }} />
            <div className="skeleton" style={{ height: 60 }} />
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => {
            const config = notificationConfig[notification.type];
            if (!config) {
              // Handle unknown notification type gracefully
              console.warn("Unknown notification type:", notification.type);
              return null;
            }
            const Icon = config.icon;
            const actorName =
              notification.actor?.battleTag.split("#")[0] ?? "Someone";

            return (
              <button
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  width: "100%",
                  padding: "var(--space-md)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-sm)",
                  background: notification.read
                    ? "transparent"
                    : "rgba(var(--accent-rgb), 0.05)",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = notification.read
                    ? "transparent"
                    : "rgba(var(--accent-rgb), 0.05)";
                }}
              >
                {/* Actor avatar or icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    background: `${config.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {notification.actor?.avatarUrl ? (
                    <img
                      src={notification.actor.avatarUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <User size={20} style={{ color: config.color }} />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: config.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={10} style={{ color: "white" }} />
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.4,
                      marginBottom: "var(--space-xs)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {config.getMessage(actorName, notification.groupCount)}
                  </p>

                  {notification.creation && (
                    <p
                      className="text-muted"
                      style={{
                        fontSize: "0.75rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {notification.creation.title}
                    </p>
                  )}

                  <span
                    className="text-muted"
                    style={{ fontSize: "0.6875rem" }}
                  >
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>

                {/* Thumbnail */}
                {notification.creation?.thumbnailUrl && (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={notification.creation.thumbnailUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                {/* Unread indicator */}
                {!notification.read && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
              </button>
            );
          })
        ) : (
          <div
            style={{
              padding: "var(--space-xl)",
              textAlign: "center",
            }}
          >
            <Bell
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}
            />
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>
              No notifications yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
