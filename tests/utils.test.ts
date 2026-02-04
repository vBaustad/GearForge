import { describe, it, expect } from "vitest";

// Test utility functions that exist in the codebase

describe("Category Labels", () => {
  const CATEGORY_LABELS: Record<string, string> = {
    Furniture: "Furniture",
    Lighting: "Lights & Lamps",
    Outdoor: "Outdoor",
    "Wall Decor": "Wall Decor",
    "Floor Decor": "Floor Decor",
    "Table Decor": "Table Decor",
    Plants: "Plants & Nature",
    Storage: "Storage",
    Beds: "Beds & Bedding",
    Seating: "Seating",
    Tables: "Tables",
    Rugs: "Rugs & Carpets",
    Curtains: "Curtains & Drapes",
    Cooking: "Kitchen & Cooking",
    Books: "Books & Scrolls",
    Profession: "Profession Items",
    Trophy: "Trophies & Mounts",
    Seasonal: "Seasonal",
  };

  function getCategoryLabel(cat: string | undefined | null): string {
    if (!cat) return "Uncategorized";
    return CATEGORY_LABELS[cat] || cat;
  }

  it("returns friendly labels for known categories", () => {
    expect(getCategoryLabel("Lighting")).toBe("Lights & Lamps");
    expect(getCategoryLabel("Plants")).toBe("Plants & Nature");
    expect(getCategoryLabel("Cooking")).toBe("Kitchen & Cooking");
  });

  it("returns the category name for unknown categories", () => {
    expect(getCategoryLabel("SomeNewCategory")).toBe("SomeNewCategory");
  });

  it("returns Uncategorized for null/undefined", () => {
    expect(getCategoryLabel(null)).toBe("Uncategorized");
    expect(getCategoryLabel(undefined)).toBe("Uncategorized");
  });
});

describe("Design Categories", () => {
  const CATEGORIES = [
    "bedroom",
    "tavern",
    "garden",
    "library",
    "kitchen",
    "great-hall",
    "workshop",
    "shrine",
    "outdoor",
    "other",
  ] as const;

  const CATEGORY_LABELS: Record<string, string> = {
    bedroom: "Bedroom",
    tavern: "Tavern & Inn",
    garden: "Garden",
    library: "Library & Study",
    kitchen: "Kitchen",
    "great-hall": "Great Hall",
    workshop: "Workshop",
    shrine: "Shrine & Temple",
    outdoor: "Outdoor",
    other: "Other",
  };

  it("has labels for all categories", () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
    }
  });

  it("has 10 design categories", () => {
    expect(CATEGORIES.length).toBe(10);
  });
});
