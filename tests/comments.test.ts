import { describe, it, expect } from "vitest";

// Comment validation constants (mirrored from convex/comments.ts)
const MAX_COMMENT_LENGTH = 1000;
const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Comment content validation
function validateCommentContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();

  if (!trimmed) {
    return { valid: false, error: "Comment cannot be empty" };
  }

  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { valid: false, error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` };
  }

  // Check for XSS patterns
  if (/<script|javascript:|on\w+=/i.test(trimmed)) {
    return { valid: false, error: "Comment contains invalid characters" };
  }

  return { valid: true };
}

// Check if comment is editable based on creation time
function isCommentEditable(createdAt: number, now: number = Date.now()): boolean {
  return now - createdAt < EDIT_WINDOW_MS;
}

// Format time ago for display
function formatTimeAgo(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

describe("Comment Validation", () => {
  describe("validateCommentContent", () => {
    it("accepts valid comment content", () => {
      expect(validateCommentContent("This is a great design!")).toEqual({ valid: true });
      expect(validateCommentContent("Love the attention to detail.")).toEqual({ valid: true });
    });

    it("rejects empty comments", () => {
      expect(validateCommentContent("")).toEqual({ valid: false, error: "Comment cannot be empty" });
      expect(validateCommentContent("   ")).toEqual({ valid: false, error: "Comment cannot be empty" });
      expect(validateCommentContent("\n\t")).toEqual({ valid: false, error: "Comment cannot be empty" });
    });

    it("rejects comments exceeding max length", () => {
      const longComment = "a".repeat(1001);
      const result = validateCommentContent(longComment);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("1000 characters");
    });

    it("accepts comments at exactly max length", () => {
      const maxComment = "a".repeat(1000);
      expect(validateCommentContent(maxComment)).toEqual({ valid: true });
    });

    it("rejects comments with script tags", () => {
      expect(validateCommentContent("<script>alert('xss')</script>")).toEqual({
        valid: false,
        error: "Comment contains invalid characters",
      });
    });

    it("rejects comments with javascript: URLs", () => {
      expect(validateCommentContent("javascript:alert('xss')")).toEqual({
        valid: false,
        error: "Comment contains invalid characters",
      });
    });

    it("rejects comments with inline event handlers", () => {
      expect(validateCommentContent('<img onerror="alert(1)">')).toEqual({
        valid: false,
        error: "Comment contains invalid characters",
      });
    });

    it("allows normal HTML-like text that is not malicious", () => {
      expect(validateCommentContent("I think 5 < 10 and 10 > 5")).toEqual({ valid: true });
      expect(validateCommentContent("Use the <import> feature")).toEqual({ valid: true });
    });
  });

  describe("isCommentEditable", () => {
    it("returns true for comments within 15 minutes", () => {
      const now = Date.now();
      const createdAt = now - 5 * 60 * 1000; // 5 minutes ago
      expect(isCommentEditable(createdAt, now)).toBe(true);
    });

    it("returns true for comments just under 15 minutes", () => {
      const now = Date.now();
      const createdAt = now - 14 * 60 * 1000 - 59 * 1000; // 14:59 ago
      expect(isCommentEditable(createdAt, now)).toBe(true);
    });

    it("returns false for comments at exactly 15 minutes", () => {
      const now = Date.now();
      const createdAt = now - 15 * 60 * 1000; // Exactly 15 minutes ago
      expect(isCommentEditable(createdAt, now)).toBe(false);
    });

    it("returns false for comments older than 15 minutes", () => {
      const now = Date.now();
      const createdAt = now - 20 * 60 * 1000; // 20 minutes ago
      expect(isCommentEditable(createdAt, now)).toBe(false);
    });

    it("returns true for comments just created", () => {
      const now = Date.now();
      expect(isCommentEditable(now, now)).toBe(true);
    });
  });

  describe("formatTimeAgo", () => {
    it("returns 'just now' for very recent timestamps", () => {
      const now = Date.now();
      expect(formatTimeAgo(now, now)).toBe("just now");
      expect(formatTimeAgo(now - 30 * 1000, now)).toBe("just now"); // 30 seconds
    });

    it("returns minutes for timestamps under an hour", () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 5 * 60 * 1000, now)).toBe("5m ago");
      expect(formatTimeAgo(now - 59 * 60 * 1000, now)).toBe("59m ago");
    });

    it("returns hours for timestamps under a day", () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 2 * 60 * 60 * 1000, now)).toBe("2h ago");
      expect(formatTimeAgo(now - 23 * 60 * 60 * 1000, now)).toBe("23h ago");
    });

    it("returns days for timestamps under a week", () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 24 * 60 * 60 * 1000, now)).toBe("1d ago");
      expect(formatTimeAgo(now - 6 * 24 * 60 * 60 * 1000, now)).toBe("6d ago");
    });

    it("returns formatted date for timestamps older than a week", () => {
      const now = Date.now();
      const oldTimestamp = now - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      const result = formatTimeAgo(oldTimestamp, now);
      // Should be a date string, not "Xd ago"
      expect(result).not.toContain("d ago");
      expect(result).toContain("/"); // Date format like "1/15/2025"
    });
  });
});

describe("Comment Threading", () => {
  // Max depth is 2 (top-level + 1 reply level)
  const MAX_COMMENT_DEPTH = 2;

  function canReply(parentDepth: number): boolean {
    return parentDepth < MAX_COMMENT_DEPTH - 1;
  }

  it("allows replies to top-level comments", () => {
    expect(canReply(0)).toBe(true); // Top-level comment (depth 0)
  });

  it("does not allow replies to replies", () => {
    expect(canReply(1)).toBe(false); // Reply (depth 1)
  });
});
