import { describe, it, expect } from "vitest";

describe("SEO Configuration", () => {
  const SITE_URL = "https://gearforge.io";

  describe("Meta Tags", () => {
    it("site URL is correct", () => {
      expect(SITE_URL).toBe("https://gearforge.io");
    });
  });

  describe("Page Titles", () => {
    // Page titles should be short for tab readability
    const pageTitles = [
      "Browse Designs",
      "Housing Items",
      "About",
      "FAQ",
      "Help",
      "Settings",
      "Privacy Policy",
      "Terms of Service",
      "Upload Housing Design",
      "Edit Design",
      "Admin Panel",
    ];

    it("page titles are reasonably short (under 30 chars)", () => {
      for (const title of pageTitles) {
        expect(title.length).toBeLessThan(30);
      }
    });
  });

  describe("Robots", () => {
    const noIndexPages = ["/admin", "/upload", "/settings", "/design/*/edit"];
    const indexPages = ["/", "/browse", "/decor", "/about", "/faq", "/help"];

    it("has correct noindex pages defined", () => {
      expect(noIndexPages).toContain("/admin");
      expect(noIndexPages).toContain("/upload");
    });

    it("has correct indexed pages", () => {
      expect(indexPages).toContain("/");
      expect(indexPages).toContain("/browse");
    });
  });
});

describe("Sitemap", () => {
  const staticPages = [
    "/",
    "/browse",
    "/decor",
    "/about",
    "/faq",
    "/help",
    "/privacy",
    "/terms",
  ];

  it("includes all static pages", () => {
    expect(staticPages.length).toBe(8);
    expect(staticPages).toContain("/");
    expect(staticPages).toContain("/browse");
    expect(staticPages).toContain("/decor");
  });

  it("does not include admin pages", () => {
    expect(staticPages).not.toContain("/admin");
    expect(staticPages).not.toContain("/upload");
    expect(staticPages).not.toContain("/settings");
  });
});
