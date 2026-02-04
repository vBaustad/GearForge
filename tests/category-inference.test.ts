import { describe, it, expect } from "vitest";

// Copy of the category inference function from convex/gameData.ts
// This tests the logic without needing Convex runtime
function inferCategoryFromName(name: string): string {
  const nameLower = name.toLowerCase();

  // Storage (check before Books because "bookcase" contains "book")
  if (/shelf|bookcase|cabinet|cupboard|wardrobe|armoire|dresser|chest(?!nut)|crate|barrel/.test(nameLower)) {
    return "Storage";
  }
  // Books (check early to avoid "Twilight" matching "light")
  if (/\btome\b|scroll|journal|\bbook\b/.test(nameLower)) {
    return "Books";
  }
  if (/lamp|lantern|candle|torch|chandelier|sconce|\blight\b/.test(nameLower)) {
    return "Lighting";
  }
  if (/couch|sofa|seat|bench|chair|stool|throne/.test(nameLower)) {
    return "Seating";
  }
  if (/table|desk|counter|worktable/.test(nameLower)) {
    return "Tables";
  }
  if (/bed|mattress|hammock|cot/.test(nameLower)) {
    return "Beds";
  }
  if (/rug|carpet|mat/.test(nameLower)) {
    return "Rugs";
  }
  if (/plant|flower|tree|bush|shrub|vine|fern|moss|mushroom|poppy|rose|lily|tulip|potted/.test(nameLower)) {
    return "Plants";
  }
  if (/fence|gate|trellis|archway|bridge|well|fountain|tent|awning|post(?!er)/.test(nameLower)) {
    return "Outdoor";
  }
  if (/painting|portrait|banner|tapestry|mirror|clock|poster|sign|plaque/.test(nameLower)) {
    return "Wall Decor";
  }
  if (/wall|pillar|column|door|window|stair|railing|beam|floor|ceiling|arch/.test(nameLower)) {
    return "Structure";
  }
  if (/pot|pan|kettle|cauldron|oven|stove|kitchen|cooking|food|bread|meat|fruit|vegetable|mineloaf/.test(nameLower)) {
    return "Cooking";
  }
  if (/anvil|forge|loom|spinning|crafting|tool|workbench|enchant|alchemist|jewelcraft/.test(nameLower)) {
    return "Profession";
  }
  if (/weapon|sword|axe|bow|shield|armor|trophy|mount|skull|head/.test(nameLower)) {
    return "Trophy";
  }
  if (/statue|figurine|vase|urn|orb|crystal|candelabra/.test(nameLower)) {
    return "Floor Decor";
  }
  if (/goblet|cup|mug|plate|bowl|bottle|flask|inkwell|quill/.test(nameLower)) {
    return "Table Decor";
  }
  if (/curtain|drape/.test(nameLower)) {
    return "Curtains";
  }

  return "Uncategorized";
}

describe("Category Inference", () => {
  describe("Lighting", () => {
    it("categorizes lamps correctly", () => {
      expect(inferCategoryFromName("Wrought Iron Floor Lamp")).toBe("Lighting");
      expect(inferCategoryFromName("Hooded Iron Lantern")).toBe("Lighting");
      expect(inferCategoryFromName("Stormwind Lamppost")).toBe("Lighting");
    });
  });

  describe("Seating", () => {
    it("categorizes seating correctly", () => {
      expect(inferCategoryFromName("Kaldorei Cushioned Seat")).toBe("Seating");
      expect(inferCategoryFromName("Charming Couch")).toBe("Seating");
      expect(inferCategoryFromName("Valdrakken Gilded Throne")).toBe("Seating");
      expect(inferCategoryFromName("Leather-Banded Wooden Bench")).toBe("Seating");
    });
  });

  describe("Tables", () => {
    it("categorizes tables correctly", () => {
      expect(inferCategoryFromName("Kaldorei Desk")).toBe("Tables");
      expect(inferCategoryFromName("Kaldorei Chef's Table")).toBe("Tables");
      expect(inferCategoryFromName("Acherus Worktable")).toBe("Tables");
    });
  });

  describe("Storage", () => {
    it("categorizes storage correctly", () => {
      expect(inferCategoryFromName("Kaldorei Wall Shelf")).toBe("Storage");
      expect(inferCategoryFromName("Dreadscar Bookcase")).toBe("Storage");
      expect(inferCategoryFromName("Iron-Reinforced Cupboard")).toBe("Storage");
      expect(inferCategoryFromName("Durable Wooden Chest")).toBe("Storage");
      expect(inferCategoryFromName("Iron-Reinforced Crate")).toBe("Storage");
    });

    it("does not match chestnut as chest", () => {
      expect(inferCategoryFromName("Chestnut Tree")).toBe("Plants");
    });
  });

  describe("Structure", () => {
    it("categorizes structure correctly", () => {
      expect(inferCategoryFromName("Sturdy Wooden Interior Pillar")).toBe("Structure");
      expect(inferCategoryFromName("Gilnean Stone Wall")).toBe("Structure");
      expect(inferCategoryFromName("Elegant Carved Door")).toBe("Structure");
    });
  });

  describe("Plants", () => {
    it("categorizes plants correctly", () => {
      expect(inferCategoryFromName("Small Poppy Cluster")).toBe("Plants");
      expect(inferCategoryFromName("Veilroot Fountain")).toBe("Outdoor"); // fountain takes precedence
    });
  });

  describe("Outdoor", () => {
    it("categorizes outdoor items correctly", () => {
      expect(inferCategoryFromName("Elwynn Fence")).toBe("Outdoor");
      expect(inferCategoryFromName("Sturdy Wooden Trellis")).toBe("Outdoor");
      expect(inferCategoryFromName("Valdrakken Market Tent")).toBe("Outdoor");
    });
  });

  describe("Rugs", () => {
    it("categorizes rugs correctly", () => {
      expect(inferCategoryFromName("Evoker's Elegant Rug")).toBe("Rugs");
    });
  });

  describe("Books", () => {
    it("categorizes books correctly", () => {
      expect(inferCategoryFromName("Tome of Twilight Nihilism")).toBe("Books");
    });
  });

  describe("Cooking", () => {
    it("categorizes cooking items correctly", () => {
      expect(inferCategoryFromName("Dornic Sliced Mineloaf")).toBe("Cooking");
    });
  });

  describe("Trophy", () => {
    it("categorizes weapon displays correctly", () => {
      expect(inferCategoryFromName("Stormwind Weapon Rack")).toBe("Trophy");
      expect(inferCategoryFromName("Trueshot Lodge Weapon Rack")).toBe("Trophy");
    });
  });

  describe("Uncategorized", () => {
    it("returns Uncategorized for unknown items", () => {
      expect(inferCategoryFromName("Random Item Name")).toBe("Uncategorized");
    });
  });
});
