import { describe, it, expect } from "vitest";

// Badge type definition (mirrored from convex/badges.ts)
type BadgeType =
  | "first_design"
  | "prolific_creator"
  | "popular_creator"
  | "viral_design"
  | "community_pillar"
  | "helpful_commenter"
  | "early_adopter"
  | "featured_design";

// Badge definitions with metadata
const BADGE_DEFINITIONS: Record<
  BadgeType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    requirement?: string;
  }
> = {
  first_design: {
    name: "First Creation",
    description: "Created your first design",
    icon: "sparkles",
    color: "#f59e0b",
    requirement: "Create 1 design",
  },
  prolific_creator: {
    name: "Prolific Creator",
    description: "Created 10 designs",
    icon: "palette",
    color: "#8b5cf6",
    requirement: "Create 10 designs",
  },
  popular_creator: {
    name: "Popular Creator",
    description: "Received 100 total likes",
    icon: "heart",
    color: "#ef4444",
    requirement: "Get 100 likes on your designs",
  },
  viral_design: {
    name: "Viral Design",
    description: "Had a design with 50+ likes",
    icon: "trending-up",
    color: "#22c55e",
    requirement: "Get 50 likes on a single design",
  },
  community_pillar: {
    name: "Community Pillar",
    description: "Gained 50+ followers",
    icon: "users",
    color: "#3b82f6",
    requirement: "Get 50 followers",
  },
  helpful_commenter: {
    name: "Helpful Commenter",
    description: "Posted 50+ comments",
    icon: "message-square",
    color: "#06b6d4",
    requirement: "Post 50 comments",
  },
  early_adopter: {
    name: "Early Adopter",
    description: "Joined during the early days",
    icon: "rocket",
    color: "#ec4899",
  },
  featured_design: {
    name: "Featured",
    description: "Had a design featured by the team",
    icon: "star",
    color: "#eab308",
  },
};

// Badge thresholds
const BADGE_THRESHOLDS = {
  first_design: 1,
  prolific_creator: 10,
  popular_creator: 100,
  viral_design: 50,
  community_pillar: 50,
  helpful_commenter: 50,
};

// Check if user qualifies for design count badges
function checkDesignCountBadges(designCount: number): BadgeType[] {
  const earned: BadgeType[] = [];

  if (designCount >= BADGE_THRESHOLDS.first_design) {
    earned.push("first_design");
  }
  if (designCount >= BADGE_THRESHOLDS.prolific_creator) {
    earned.push("prolific_creator");
  }

  return earned;
}

// Check if user qualifies for like-related badges
function checkLikeBadges(totalLikes: number, maxSingleDesignLikes: number): BadgeType[] {
  const earned: BadgeType[] = [];

  if (totalLikes >= BADGE_THRESHOLDS.popular_creator) {
    earned.push("popular_creator");
  }
  if (maxSingleDesignLikes >= BADGE_THRESHOLDS.viral_design) {
    earned.push("viral_design");
  }

  return earned;
}

// Check if user qualifies for follower badge
function checkFollowerBadge(followerCount: number): boolean {
  return followerCount >= BADGE_THRESHOLDS.community_pillar;
}

// Check if user qualifies for comment badge
function checkCommentBadge(commentCount: number): boolean {
  return commentCount >= BADGE_THRESHOLDS.helpful_commenter;
}

describe("Badge Definitions", () => {
  const allBadgeTypes: BadgeType[] = [
    "first_design",
    "prolific_creator",
    "popular_creator",
    "viral_design",
    "community_pillar",
    "helpful_commenter",
    "early_adopter",
    "featured_design",
  ];

  it("has 8 badge types defined", () => {
    expect(Object.keys(BADGE_DEFINITIONS)).toHaveLength(8);
  });

  it("has definitions for all badge types", () => {
    for (const badgeType of allBadgeTypes) {
      expect(BADGE_DEFINITIONS[badgeType]).toBeDefined();
    }
  });

  it("each badge has required fields", () => {
    for (const [type, def] of Object.entries(BADGE_DEFINITIONS)) {
      expect(def.name).toBeDefined();
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.description).toBeDefined();
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.icon).toBeDefined();
      expect(def.color).toMatch(/^#[0-9a-fA-F]{6}$/); // Valid hex color
    }
  });

  it("auto-awarded badges have requirements", () => {
    const autoAwardedBadges: BadgeType[] = [
      "first_design",
      "prolific_creator",
      "popular_creator",
      "viral_design",
      "community_pillar",
      "helpful_commenter",
    ];

    for (const badgeType of autoAwardedBadges) {
      expect(BADGE_DEFINITIONS[badgeType].requirement).toBeDefined();
    }
  });

  it("manual badges do not have requirements", () => {
    const manualBadges: BadgeType[] = ["early_adopter", "featured_design"];

    for (const badgeType of manualBadges) {
      expect(BADGE_DEFINITIONS[badgeType].requirement).toBeUndefined();
    }
  });
});

describe("Badge Award Logic", () => {
  describe("checkDesignCountBadges", () => {
    it("awards no badges for 0 designs", () => {
      expect(checkDesignCountBadges(0)).toEqual([]);
    });

    it("awards first_design for 1 design", () => {
      const badges = checkDesignCountBadges(1);
      expect(badges).toContain("first_design");
      expect(badges).not.toContain("prolific_creator");
    });

    it("awards first_design for 5 designs", () => {
      const badges = checkDesignCountBadges(5);
      expect(badges).toContain("first_design");
      expect(badges).not.toContain("prolific_creator");
    });

    it("awards both badges for 10 designs", () => {
      const badges = checkDesignCountBadges(10);
      expect(badges).toContain("first_design");
      expect(badges).toContain("prolific_creator");
    });

    it("awards both badges for 50 designs", () => {
      const badges = checkDesignCountBadges(50);
      expect(badges).toContain("first_design");
      expect(badges).toContain("prolific_creator");
    });
  });

  describe("checkLikeBadges", () => {
    it("awards no badges for low engagement", () => {
      expect(checkLikeBadges(50, 20)).toEqual([]);
    });

    it("awards popular_creator for 100+ total likes", () => {
      const badges = checkLikeBadges(100, 30);
      expect(badges).toContain("popular_creator");
      expect(badges).not.toContain("viral_design");
    });

    it("awards viral_design for 50+ likes on single design", () => {
      const badges = checkLikeBadges(60, 50);
      expect(badges).toContain("viral_design");
      expect(badges).not.toContain("popular_creator");
    });

    it("awards both badges for high engagement", () => {
      const badges = checkLikeBadges(150, 75);
      expect(badges).toContain("popular_creator");
      expect(badges).toContain("viral_design");
    });
  });

  describe("checkFollowerBadge", () => {
    it("returns false for under 50 followers", () => {
      expect(checkFollowerBadge(0)).toBe(false);
      expect(checkFollowerBadge(25)).toBe(false);
      expect(checkFollowerBadge(49)).toBe(false);
    });

    it("returns true for 50+ followers", () => {
      expect(checkFollowerBadge(50)).toBe(true);
      expect(checkFollowerBadge(100)).toBe(true);
    });
  });

  describe("checkCommentBadge", () => {
    it("returns false for under 50 comments", () => {
      expect(checkCommentBadge(0)).toBe(false);
      expect(checkCommentBadge(25)).toBe(false);
      expect(checkCommentBadge(49)).toBe(false);
    });

    it("returns true for 50+ comments", () => {
      expect(checkCommentBadge(50)).toBe(true);
      expect(checkCommentBadge(100)).toBe(true);
    });
  });
});

describe("Badge Icon Mapping", () => {
  const validIcons = [
    "sparkles",
    "palette",
    "heart",
    "trending-up",
    "users",
    "message-square",
    "rocket",
    "star",
  ];

  it("all badge icons are valid Lucide icon names", () => {
    for (const def of Object.values(BADGE_DEFINITIONS)) {
      expect(validIcons).toContain(def.icon);
    }
  });

  it("each badge has a unique icon", () => {
    const icons = Object.values(BADGE_DEFINITIONS).map((d) => d.icon);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(icons.length);
  });
});
