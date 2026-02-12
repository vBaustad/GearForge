import { describe, it, expect } from "vitest";

// Tip link URL patterns (mirrored from convex/users.ts and src/lib/validation.ts)
const tipLinkPatterns = {
  buymeacoffee: /^(https?:\/\/)?(www\.)?buymeacoffee\.com\/[a-zA-Z0-9_.-]+\/?$/,
  kofi: /^(https?:\/\/)?(www\.)?ko-fi\.com\/[a-zA-Z0-9_]+\/?$/,
  paypal: /^(https?:\/\/)?(www\.)?paypal\.me\/[a-zA-Z0-9_.-]+\/?$/,
  patreon: /^(https?:\/\/)?(www\.)?patreon\.com\/[a-zA-Z0-9_]+\/?$/,
};

type TipPlatform = keyof typeof tipLinkPatterns;

// Platform configuration
const platformConfig: Record<
  TipPlatform,
  { label: string; color: string; textColor: string }
> = {
  buymeacoffee: {
    label: "Buy Me a Coffee",
    color: "#FFDD00",
    textColor: "#1a1a1a",
  },
  kofi: {
    label: "Ko-fi",
    color: "#FF5E5B",
    textColor: "#fff",
  },
  paypal: {
    label: "PayPal",
    color: "#003087",
    textColor: "#fff",
  },
  patreon: {
    label: "Patreon",
    color: "#FF424D",
    textColor: "#fff",
  },
};

// Validate a tip link URL
function validateTipLink(platform: TipPlatform, url: string): boolean {
  if (!url || url.trim() === "") return true; // Empty is valid (optional field)
  return tipLinkPatterns[platform].test(url);
}

// Normalize URL to always have https://
function normalizeTipLinkUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  if (trimmed.startsWith("http")) return trimmed;
  return `https://${trimmed}`;
}

// Check if any tip links are set
function hasTipLinks(tipLinks?: Record<string, string | undefined>): boolean {
  if (!tipLinks) return false;
  return Object.values(tipLinks).some((url) => url && url.trim() !== "");
}

describe("Tip Link URL Validation", () => {
  describe("Buy Me a Coffee", () => {
    it("accepts valid URLs", () => {
      expect(validateTipLink("buymeacoffee", "https://buymeacoffee.com/username")).toBe(true);
      expect(validateTipLink("buymeacoffee", "https://www.buymeacoffee.com/username")).toBe(true);
      expect(validateTipLink("buymeacoffee", "buymeacoffee.com/username")).toBe(true);
      expect(validateTipLink("buymeacoffee", "buymeacoffee.com/user_name")).toBe(true);
      expect(validateTipLink("buymeacoffee", "buymeacoffee.com/user.name")).toBe(true);
      expect(validateTipLink("buymeacoffee", "buymeacoffee.com/user-name")).toBe(true);
    });

    it("accepts URLs with trailing slash", () => {
      expect(validateTipLink("buymeacoffee", "buymeacoffee.com/username/")).toBe(true);
    });

    it("accepts empty string (optional field)", () => {
      expect(validateTipLink("buymeacoffee", "")).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(validateTipLink("buymeacoffee", "https://buymeacoffee.com/")).toBe(false);
      expect(validateTipLink("buymeacoffee", "buymeacoffee.com")).toBe(false);
      expect(validateTipLink("buymeacoffee", "https://example.com/username")).toBe(false);
      expect(validateTipLink("buymeacoffee", "random text")).toBe(false);
    });
  });

  describe("Ko-fi", () => {
    it("accepts valid URLs", () => {
      expect(validateTipLink("kofi", "https://ko-fi.com/username")).toBe(true);
      expect(validateTipLink("kofi", "https://www.ko-fi.com/username")).toBe(true);
      expect(validateTipLink("kofi", "ko-fi.com/username")).toBe(true);
      expect(validateTipLink("kofi", "ko-fi.com/user_name")).toBe(true);
    });

    it("accepts empty string (optional field)", () => {
      expect(validateTipLink("kofi", "")).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(validateTipLink("kofi", "https://ko-fi.com/")).toBe(false);
      expect(validateTipLink("kofi", "ko-fi.com")).toBe(false);
      expect(validateTipLink("kofi", "kofi.com/username")).toBe(false); // Wrong domain
    });
  });

  describe("PayPal", () => {
    it("accepts valid URLs", () => {
      expect(validateTipLink("paypal", "https://paypal.me/username")).toBe(true);
      expect(validateTipLink("paypal", "https://www.paypal.me/username")).toBe(true);
      expect(validateTipLink("paypal", "paypal.me/username")).toBe(true);
      expect(validateTipLink("paypal", "paypal.me/user.name")).toBe(true);
    });

    it("accepts empty string (optional field)", () => {
      expect(validateTipLink("paypal", "")).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(validateTipLink("paypal", "https://paypal.me/")).toBe(false);
      expect(validateTipLink("paypal", "paypal.com/username")).toBe(false); // Wrong domain
    });
  });

  describe("Patreon", () => {
    it("accepts valid URLs", () => {
      expect(validateTipLink("patreon", "https://patreon.com/username")).toBe(true);
      expect(validateTipLink("patreon", "https://www.patreon.com/username")).toBe(true);
      expect(validateTipLink("patreon", "patreon.com/username")).toBe(true);
      expect(validateTipLink("patreon", "patreon.com/user_name")).toBe(true);
    });

    it("accepts empty string (optional field)", () => {
      expect(validateTipLink("patreon", "")).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(validateTipLink("patreon", "https://patreon.com/")).toBe(false);
      expect(validateTipLink("patreon", "patreon.com")).toBe(false);
    });
  });
});

describe("URL Normalization", () => {
  it("adds https:// to URLs without protocol", () => {
    expect(normalizeTipLinkUrl("buymeacoffee.com/user")).toBe("https://buymeacoffee.com/user");
    expect(normalizeTipLinkUrl("ko-fi.com/user")).toBe("https://ko-fi.com/user");
  });

  it("preserves URLs with http://", () => {
    expect(normalizeTipLinkUrl("http://buymeacoffee.com/user")).toBe(
      "http://buymeacoffee.com/user"
    );
  });

  it("preserves URLs with https://", () => {
    expect(normalizeTipLinkUrl("https://buymeacoffee.com/user")).toBe(
      "https://buymeacoffee.com/user"
    );
  });

  it("handles empty strings", () => {
    expect(normalizeTipLinkUrl("")).toBe("");
  });

  it("trims whitespace", () => {
    expect(normalizeTipLinkUrl("  buymeacoffee.com/user  ")).toBe(
      "https://buymeacoffee.com/user"
    );
  });
});

describe("Platform Configuration", () => {
  const allPlatforms: TipPlatform[] = ["buymeacoffee", "kofi", "paypal", "patreon"];

  it("has 4 supported platforms", () => {
    expect(Object.keys(platformConfig)).toHaveLength(4);
  });

  it("each platform has required config", () => {
    for (const platform of allPlatforms) {
      const config = platformConfig[platform];
      expect(config.label).toBeDefined();
      expect(config.label.length).toBeGreaterThan(0);
      expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.textColor).toBeDefined();
    }
  });

  it("platform labels are user-friendly", () => {
    expect(platformConfig.buymeacoffee.label).toBe("Buy Me a Coffee");
    expect(platformConfig.kofi.label).toBe("Ko-fi");
    expect(platformConfig.paypal.label).toBe("PayPal");
    expect(platformConfig.patreon.label).toBe("Patreon");
  });
});

describe("hasTipLinks", () => {
  it("returns false for undefined", () => {
    expect(hasTipLinks(undefined)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(hasTipLinks({})).toBe(false);
  });

  it("returns false for object with empty strings", () => {
    expect(
      hasTipLinks({
        buymeacoffee: "",
        kofi: "",
        paypal: "",
        patreon: "",
      })
    ).toBe(false);
  });

  it("returns false for object with only whitespace", () => {
    expect(
      hasTipLinks({
        buymeacoffee: "   ",
        kofi: "\t",
      })
    ).toBe(false);
  });

  it("returns true when at least one link is set", () => {
    expect(hasTipLinks({ buymeacoffee: "buymeacoffee.com/user" })).toBe(true);
    expect(
      hasTipLinks({
        buymeacoffee: "",
        kofi: "ko-fi.com/user",
      })
    ).toBe(true);
  });

  it("returns true for fully populated links", () => {
    expect(
      hasTipLinks({
        buymeacoffee: "buymeacoffee.com/user1",
        kofi: "ko-fi.com/user2",
        paypal: "paypal.me/user3",
        patreon: "patreon.com/user4",
      })
    ).toBe(true);
  });
});
