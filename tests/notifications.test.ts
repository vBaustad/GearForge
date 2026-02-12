import { describe, it, expect } from "vitest";

// Notification types (mirrored from convex/notifications.ts)
type NotificationType =
  | "like"
  | "comment"
  | "reply"
  | "follow"
  | "new_design"
  | "comment_like"
  | "badge_earned";

// Notification grouping window (1 hour)
const GROUP_WINDOW_MS = 60 * 60 * 1000;

// Notification message generators
const notificationMessages: Record<
  NotificationType,
  (actorName: string, groupCount?: number) => string
> = {
  like: (actorName, groupCount) =>
    groupCount && groupCount > 1
      ? `${actorName} and ${groupCount - 1} others liked your design`
      : `${actorName} liked your design`,
  comment: (actorName) => `${actorName} commented on your design`,
  reply: (actorName) => `${actorName} replied to your comment`,
  follow: (actorName, groupCount) =>
    groupCount && groupCount > 1
      ? `${actorName} and ${groupCount - 1} others followed you`
      : `${actorName} followed you`,
  new_design: (actorName) => `${actorName} posted a new design`,
  comment_like: (actorName, groupCount) =>
    groupCount && groupCount > 1
      ? `${actorName} and ${groupCount - 1} others liked your comment`
      : `${actorName} liked your comment`,
  badge_earned: () => "You earned a new badge!",
};

// Generate group key for aggregatable notifications
function generateGroupKey(
  type: NotificationType,
  creationId?: string,
  recipientId?: string,
  commentId?: string
): string | undefined {
  if (type === "like" && creationId) {
    return `like:${creationId}`;
  }
  if (type === "follow" && recipientId) {
    return `follow:${recipientId}`;
  }
  if (type === "comment_like" && commentId) {
    return `comment_like:${commentId}`;
  }
  return undefined;
}

// Check if notifications can be grouped
function canGroupNotifications(
  existingCreatedAt: number,
  newCreatedAt: number
): boolean {
  return newCreatedAt - existingCreatedAt < GROUP_WINDOW_MS;
}

// Format time for notification display
function formatNotificationTime(timestamp: number, now: number = Date.now()): string {
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

describe("Notification Types", () => {
  const allTypes: NotificationType[] = [
    "like",
    "comment",
    "reply",
    "follow",
    "new_design",
    "comment_like",
    "badge_earned",
  ];

  it("has 7 notification types", () => {
    expect(allTypes).toHaveLength(7);
  });

  it("has message generators for all types", () => {
    for (const type of allTypes) {
      expect(notificationMessages[type]).toBeDefined();
      expect(typeof notificationMessages[type]).toBe("function");
    }
  });
});

describe("Notification Messages", () => {
  describe("like notifications", () => {
    it("generates single like message", () => {
      expect(notificationMessages.like("JohnDoe")).toBe("JohnDoe liked your design");
    });

    it("generates grouped like message", () => {
      expect(notificationMessages.like("JohnDoe", 5)).toBe(
        "JohnDoe and 4 others liked your design"
      );
    });

    it("generates singular grouped message for 2 people", () => {
      expect(notificationMessages.like("JohnDoe", 2)).toBe(
        "JohnDoe and 1 others liked your design"
      );
    });
  });

  describe("comment notifications", () => {
    it("generates comment message", () => {
      expect(notificationMessages.comment("JaneDoe")).toBe(
        "JaneDoe commented on your design"
      );
    });
  });

  describe("reply notifications", () => {
    it("generates reply message", () => {
      expect(notificationMessages.reply("Player123")).toBe(
        "Player123 replied to your comment"
      );
    });
  });

  describe("follow notifications", () => {
    it("generates single follow message", () => {
      expect(notificationMessages.follow("NewFan")).toBe("NewFan followed you");
    });

    it("generates grouped follow message", () => {
      expect(notificationMessages.follow("NewFan", 10)).toBe(
        "NewFan and 9 others followed you"
      );
    });
  });

  describe("new_design notifications", () => {
    it("generates new design message", () => {
      expect(notificationMessages.new_design("Creator")).toBe(
        "Creator posted a new design"
      );
    });
  });

  describe("comment_like notifications", () => {
    it("generates single comment like message", () => {
      expect(notificationMessages.comment_like("Supporter")).toBe(
        "Supporter liked your comment"
      );
    });

    it("generates grouped comment like message", () => {
      expect(notificationMessages.comment_like("Supporter", 3)).toBe(
        "Supporter and 2 others liked your comment"
      );
    });
  });

  describe("badge_earned notifications", () => {
    it("generates badge earned message", () => {
      expect(notificationMessages.badge_earned("")).toBe("You earned a new badge!");
    });

    it("ignores actor name for badge notifications", () => {
      expect(notificationMessages.badge_earned("SomeUser")).toBe(
        "You earned a new badge!"
      );
    });
  });
});

describe("Notification Grouping", () => {
  describe("generateGroupKey", () => {
    it("generates key for like notifications", () => {
      expect(generateGroupKey("like", "creation123")).toBe("like:creation123");
    });

    it("generates key for follow notifications", () => {
      expect(generateGroupKey("follow", undefined, "user456")).toBe("follow:user456");
    });

    it("generates key for comment_like notifications", () => {
      expect(generateGroupKey("comment_like", undefined, undefined, "comment789")).toBe(
        "comment_like:comment789"
      );
    });

    it("returns undefined for non-groupable notifications", () => {
      expect(generateGroupKey("comment", "creation123")).toBeUndefined();
      expect(generateGroupKey("reply", "creation123")).toBeUndefined();
      expect(generateGroupKey("new_design", "creation123")).toBeUndefined();
      expect(generateGroupKey("badge_earned")).toBeUndefined();
    });
  });

  describe("canGroupNotifications", () => {
    const now = Date.now();

    it("allows grouping within 1 hour", () => {
      const existing = now - 30 * 60 * 1000; // 30 minutes ago
      expect(canGroupNotifications(existing, now)).toBe(true);
    });

    it("allows grouping at exactly under 1 hour", () => {
      const existing = now - 59 * 60 * 1000; // 59 minutes ago
      expect(canGroupNotifications(existing, now)).toBe(true);
    });

    it("does not allow grouping at exactly 1 hour", () => {
      const existing = now - 60 * 60 * 1000; // Exactly 1 hour ago
      expect(canGroupNotifications(existing, now)).toBe(false);
    });

    it("does not allow grouping after 1 hour", () => {
      const existing = now - 2 * 60 * 60 * 1000; // 2 hours ago
      expect(canGroupNotifications(existing, now)).toBe(false);
    });
  });
});

describe("Notification Time Formatting", () => {
  const now = Date.now();

  it("shows 'just now' for recent notifications", () => {
    expect(formatNotificationTime(now, now)).toBe("just now");
    expect(formatNotificationTime(now - 30 * 1000, now)).toBe("just now");
  });

  it("shows minutes for notifications under an hour", () => {
    expect(formatNotificationTime(now - 5 * 60 * 1000, now)).toBe("5m");
    expect(formatNotificationTime(now - 45 * 60 * 1000, now)).toBe("45m");
  });

  it("shows hours for notifications under a day", () => {
    expect(formatNotificationTime(now - 3 * 60 * 60 * 1000, now)).toBe("3h");
    expect(formatNotificationTime(now - 20 * 60 * 60 * 1000, now)).toBe("20h");
  });

  it("shows days for notifications under a week", () => {
    expect(formatNotificationTime(now - 2 * 24 * 60 * 60 * 1000, now)).toBe("2d");
    expect(formatNotificationTime(now - 5 * 24 * 60 * 60 * 1000, now)).toBe("5d");
  });

  it("shows date for older notifications", () => {
    const oldTimestamp = now - 10 * 24 * 60 * 60 * 1000; // 10 days ago
    const result = formatNotificationTime(oldTimestamp, now);
    expect(result).not.toContain("d");
    expect(result).toContain("/");
  });
});

describe("Self-Notification Prevention", () => {
  function shouldNotify(actorId: string, recipientId: string): boolean {
    return actorId !== recipientId;
  }

  it("does not notify for self-actions", () => {
    expect(shouldNotify("user123", "user123")).toBe(false);
  });

  it("notifies for actions by other users", () => {
    expect(shouldNotify("user123", "user456")).toBe(true);
  });
});
