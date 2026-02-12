import { query, mutation, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Helper: fetch with timeout to prevent hanging requests
const FETCH_TIMEOUT_MS = 15000; // 15 seconds

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// ===== QUERIES - Read from local cache =====

// Max search string length to prevent ReDoS
const MAX_SEARCH_LENGTH = 100;

// Get all decor items from local cache
export const getDecorItems = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items;

    // Filter by category if provided
    if (args.category) {
      items = await ctx.db
        .query("decorItems")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    } else {
      items = await ctx.db.query("decorItems").collect();
    }

    // Search filter (case-insensitive name search) with length limit
    if (args.search) {
      const searchLower = args.search.slice(0, MAX_SEARCH_LENGTH).toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name));

    // Limit results
    if (args.limit) {
      items = items.slice(0, args.limit);
    }

    return items;
  },
});

// Get single decor item by Blizzard ID
export const getDecorByBlizzardId = query({
  args: { blizzardId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("decorItems")
      .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", args.blizzardId))
      .first();
  },
});

// Get single decor item by WoW Item ID (internal - for test action)
export const getDecorByWowItemId = internalQuery({
  args: { wowItemId: v.number() },
  handler: async (ctx, args) => {
    // No index on wowItemId, so we need to scan
    const items = await ctx.db.query("decorItems").collect();
    return items.find((item) => item.wowItemId === args.wowItemId) || null;
  },
});

// Reset enrichment timestamp to allow re-enrichment
export const resetEnrichmentTimestamps = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("decorItems").collect();
    let count = 0;
    for (const item of items) {
      if (item.tooltipEnrichedAt !== undefined) {
        await ctx.db.patch(item._id, { tooltipEnrichedAt: undefined });
        count++;
      }
    }
    return { reset: count };
  },
});

// Get decor items for Wowhead enrichment
export const getDecorItemsForEnrichment = internalQuery({
  args: {
    limit: v.number(),
    onlyMissingBudget: v.boolean(),
    onlyMissingNewFields: v.optional(v.boolean()), // For re-enrichment with new parsing
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("decorItems").collect();

    // Filter items that have wowItemId
    let filtered = items.filter((item) => item.wowItemId !== undefined);

    // Filter to items missing budget cost
    if (args.onlyMissingBudget) {
      filtered = filtered.filter((item) => item.budgetCost === undefined || item.budgetCost === null);
    }

    // Filter to items that haven't been enriched with the new tooltip parser
    if (args.onlyMissingNewFields) {
      filtered = filtered.filter((item) => {
        // Items processed by the new parser have tooltipEnrichedAt set
        return item.tooltipEnrichedAt === undefined;
      });
    }

    return filtered.slice(0, args.limit);
  },
});

// Update decor item with budget cost
export const updateDecorBudgetCost = internalMutation({
  args: {
    blizzardId: v.number(),
    budgetCost: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("decorItems")
      .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", args.blizzardId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { budgetCost: args.budgetCost });
      return true;
    }
    return false;
  },
});

// Update decor item with all Wowhead tooltip data
export const updateDecorFromWowhead = internalMutation({
  args: {
    blizzardId: v.number(),
    budgetCost: v.optional(v.number()),
    goldCost: v.optional(v.number()),
    currencyType: v.optional(v.string()),
    currencyCost: v.optional(v.number()),
    reputationFaction: v.optional(v.string()),
    reputationStanding: v.optional(v.string()),
    professionName: v.optional(v.string()),
    professionSkillRequired: v.optional(v.number()),
    questName: v.optional(v.string()),
    questId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("decorItems")
      .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", args.blizzardId))
      .first();

    if (existing) {
      const updates: Record<string, any> = {};

      if (args.budgetCost !== undefined) updates.budgetCost = args.budgetCost;
      if (args.goldCost !== undefined) updates.goldCost = args.goldCost;
      if (args.currencyType !== undefined) updates.currencyType = args.currencyType;
      if (args.currencyCost !== undefined) updates.currencyCost = args.currencyCost;
      if (args.reputationFaction !== undefined) updates.reputationFaction = args.reputationFaction;
      if (args.reputationStanding !== undefined) updates.reputationStanding = args.reputationStanding;
      if (args.professionName !== undefined) updates.professionName = args.professionName;
      if (args.professionSkillRequired !== undefined) updates.professionSkillRequired = args.professionSkillRequired;
      if (args.questName !== undefined) updates.questName = args.questName;
      if (args.questId !== undefined) updates.questId = args.questId;

      // Always set the enrichment timestamp when processing
      updates.tooltipEnrichedAt = Date.now();

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
        return true;
      }
    }
    return false;
  },
});

// Get multiple decor items by Blizzard IDs
export const getDecorByIds = query({
  args: { blizzardIds: v.array(v.number()) },
  handler: async (ctx, args) => {
    const items = await Promise.all(
      args.blizzardIds.map(async (id) => {
        return await ctx.db
          .query("decorItems")
          .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", id))
          .first();
      })
    );
    return items.filter(Boolean);
  },
});

// Get all fixture items from local cache
export const getFixtureItems = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items;

    if (args.category) {
      items = await ctx.db
        .query("fixtureItems")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    } else {
      items = await ctx.db.query("fixtureItems").collect();
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => a.name.localeCompare(b.name));

    if (args.limit) {
      items = items.slice(0, args.limit);
    }

    return items;
  },
});

// Get all rooms from local cache
export const getRooms = query({
  handler: async (ctx) => {
    const rooms = await ctx.db.query("rooms").collect();
    return rooms.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get cache stats
export const getCacheStats = query({
  handler: async (ctx) => {
    const [decorItems, fixtureItems, rooms] = await Promise.all([
      ctx.db.query("decorItems").collect(),
      ctx.db.query("fixtureItems").collect(),
      ctx.db.query("rooms").collect(),
    ]);

    const oldestDecor = decorItems.length > 0
      ? Math.min(...decorItems.map((d) => d.cachedAt))
      : null;
    const oldestFixture = fixtureItems.length > 0
      ? Math.min(...fixtureItems.map((f) => f.cachedAt))
      : null;
    const oldestRoom = rooms.length > 0
      ? Math.min(...rooms.map((r) => r.cachedAt))
      : null;

    return {
      decorCount: decorItems.length,
      fixtureCount: fixtureItems.length,
      roomCount: rooms.length,
      oldestCacheDate: Math.min(
        oldestDecor ?? Date.now(),
        oldestFixture ?? Date.now(),
        oldestRoom ?? Date.now()
      ),
    };
  },
});

// Get unique decor categories
export const getDecorCategories = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("decorItems").collect();
    const categories = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(categories).sort();
  },
});

// ===== INTERNAL MUTATIONS - Called by actions =====

export const upsertDecorItem = internalMutation({
  args: {
    blizzardId: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    wowItemId: v.optional(v.number()),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    sourceDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("decorItems")
      .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", args.blizzardId))
      .first();

    const data = {
      blizzardId: args.blizzardId,
      name: args.name,
      description: args.description,
      iconUrl: args.iconUrl,
      wowItemId: args.wowItemId,
      category: args.category,
      source: args.source,
      sourceDetails: args.sourceDetails,
      cachedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("decorItems", data);
    }
  },
});

export const upsertFixtureItem = internalMutation({
  args: {
    blizzardId: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fixtureItems")
      .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", args.blizzardId))
      .first();

    const data = {
      blizzardId: args.blizzardId,
      name: args.name,
      description: args.description,
      iconUrl: args.iconUrl,
      category: args.category,
      cachedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("fixtureItems", data);
    }
  },
});

export const upsertRoom = internalMutation({
  args: {
    blizzardId: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rooms")
      .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", args.blizzardId))
      .first();

    const data = {
      blizzardId: args.blizzardId,
      name: args.name,
      description: args.description,
      cachedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("rooms", data);
    }
  },
});

// Batch upsert for efficiency
export const batchUpsertDecorItems = internalMutation({
  args: {
    items: v.array(
      v.object({
        blizzardId: v.number(),
        name: v.string(),
        description: v.optional(v.string()),
        iconUrl: v.optional(v.string()),
        wowItemId: v.optional(v.number()),
        category: v.optional(v.string()),
        source: v.optional(v.string()),
        sourceDetails: v.optional(v.string()),
        // Quest/Achievement requirements
        questId: v.optional(v.number()),
        questName: v.optional(v.string()),
        achievementId: v.optional(v.number()),
        achievementName: v.optional(v.string()),
        // Housing budget cost
        budgetCost: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let upserted = 0;

    for (const item of args.items) {
      const existing = await ctx.db
        .query("decorItems")
        .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", item.blizzardId))
        .first();

      const data = {
        ...item,
        cachedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        await ctx.db.insert("decorItems", data);
      }
      upserted++;
    }

    return { upserted };
  },
});

export const batchUpsertFixtureItems = internalMutation({
  args: {
    items: v.array(
      v.object({
        blizzardId: v.number(),
        name: v.string(),
        description: v.optional(v.string()),
        iconUrl: v.optional(v.string()),
        category: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let upserted = 0;

    for (const item of args.items) {
      const existing = await ctx.db
        .query("fixtureItems")
        .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", item.blizzardId))
        .first();

      const data = {
        ...item,
        cachedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        await ctx.db.insert("fixtureItems", data);
      }
      upserted++;
    }

    return { upserted };
  },
});

export const batchUpsertRooms = internalMutation({
  args: {
    items: v.array(
      v.object({
        blizzardId: v.number(),
        name: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let upserted = 0;

    for (const item of args.items) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", item.blizzardId))
        .first();

      const data = {
        ...item,
        cachedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        await ctx.db.insert("rooms", data);
      }
      upserted++;
    }

    return { upserted };
  },
});

// ===== HELPER FUNCTIONS =====

// Infer category from item name when Blizzard doesn't provide one
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

  // Lighting
  if (/lamp|lantern|candle|torch|chandelier|sconce|\blight\b/.test(nameLower)) {
    return "Lighting";
  }

  // Seating
  if (/couch|sofa|seat|bench|chair|stool|throne/.test(nameLower)) {
    return "Seating";
  }

  // Tables
  if (/table|desk|counter|worktable/.test(nameLower)) {
    return "Tables";
  }


  // Beds
  if (/bed|mattress|hammock|cot/.test(nameLower)) {
    return "Beds";
  }

  // Rugs
  if (/rug|carpet|mat/.test(nameLower)) {
    return "Rugs";
  }


  // Plants
  if (/plant|flower|tree|bush|shrub|vine|fern|moss|mushroom|poppy|rose|lily|tulip|potted/.test(nameLower)) {
    return "Plants";
  }

  // Outdoor structures
  if (/fence|gate|trellis|archway|bridge|well|fountain|tent|awning|post(?!er)/.test(nameLower)) {
    return "Outdoor";
  }

  // Wall decor
  if (/painting|portrait|banner|tapestry|mirror|clock|poster|sign|plaque/.test(nameLower)) {
    return "Wall Decor";
  }

  // Structure/Architecture
  if (/wall|pillar|column|door|window|stair|railing|beam|floor|ceiling|arch/.test(nameLower)) {
    return "Structure";
  }

  // Kitchen/Cooking
  if (/pot|pan|kettle|cauldron|oven|stove|kitchen|cooking|food|bread|meat|fruit|vegetable|mineloaf/.test(nameLower)) {
    return "Cooking";
  }

  // Profession items
  if (/anvil|forge|loom|spinning|crafting|tool|workbench|enchant|alchemist|jewelcraft/.test(nameLower)) {
    return "Profession";
  }

  // Weapons/Trophy displays
  if (/weapon|sword|axe|bow|shield|armor|trophy|mount|skull|head/.test(nameLower)) {
    return "Trophy";
  }

  // Floor decor (default catchall for small items)
  if (/statue|figurine|vase|urn|orb|crystal|candelabra/.test(nameLower)) {
    return "Floor Decor";
  }

  // Table decor (small items typically placed on surfaces)
  if (/goblet|cup|mug|plate|bowl|bottle|flask|inkwell|quill/.test(nameLower)) {
    return "Table Decor";
  }

  // Curtains
  if (/curtain|drape/.test(nameLower)) {
    return "Curtains";
  }

  return "Uncategorized";
}

// Helper to get Blizzard OAuth token
async function getBlizzardAccessToken(clientId: string, clientSecret: string, region: string): Promise<string> {
  // OAuth endpoint is always oauth.battle.net (not region-specific)
  const tokenUrl = region === "cn"
    ? "https://oauth.battlenet.com.cn/token"
    : "https://oauth.battle.net/token";

  const response = await fetchWithTimeout(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ===== TEST ACTION - Debug API response =====

export const testBlizzardApi = action({
  args: {
    decorId: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { error: "Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET in Convex env vars" };
    }

    const decorId = args.decorId || 533; // Default: Sturdy Wooden Interior Pillar
    const region = "us";
    const namespace = `static-${region}`;
    const locale = "en_US";

    // Get access token
    const tokenUrl = "https://oauth.battle.net/token";
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      return { error: `Token error: ${tokenResponse.status} - ${tokenError}` };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch single decor item from Blizzard
    const apiUrl = `https://${region}.api.blizzard.com/data/wow/decor/${decorId}?namespace=${namespace}&locale=${locale}`;
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const blizzardData = await response.json();

    // Generate the Wowhead icon URL we use
    const folder = decorId % 256;
    const wowheadIconUrl = `https://wow.zamimg.com/modelviewer/live/webthumbs/decor/${folder}/${decorId}.webp`;

    // Infer category from name
    const itemName = blizzardData.name?.en_US || blizzardData.name || "Unknown";
    const inferredCategory = inferCategoryFromName(itemName);

    // Parse source data (achievements, quests, etc.)
    let parsedSource: {
      type?: string;
      achievementId?: number;
      achievementName?: string;
      questId?: number;
      questName?: string;
      vendorName?: string;
    } = {};

    if (Array.isArray(blizzardData.source)) {
      for (const src of blizzardData.source) {
        if (src.achievements && src.achievements.length > 0) {
          parsedSource.type = "achievement";
          parsedSource.achievementId = src.achievements[0].id;
          parsedSource.achievementName = src.achievements[0].name?.en_US || src.achievements[0].name;
        }
        if (src.quests && src.quests.length > 0) {
          parsedSource.type = "quest";
          parsedSource.questId = src.quests[0].id;
          parsedSource.questName = src.quests[0].name?.en_US || src.quests[0].name;
        }
        if (src.vendors && src.vendors.length > 0) {
          parsedSource.type = "vendor";
          parsedSource.vendorName = src.vendors[0].name?.en_US || src.vendors[0].name;
        }
      }
    }

    return {
      decorId,
      blizzardApi: {
        url: apiUrl,
        status: response.status,
        data: blizzardData,
      },
      wowhead: {
        iconUrl: wowheadIconUrl,
        itemPageUrl: blizzardData.items?.id
          ? `https://www.wowhead.com/item=${blizzardData.items.id}`
          : null,
        achievementUrl: parsedSource.achievementId
          ? `https://www.wowhead.com/achievement=${parsedSource.achievementId}`
          : null,
        questUrl: parsedSource.questId
          ? `https://www.wowhead.com/quest=${parsedSource.questId}`
          : null,
      },
      processing: {
        name: itemName,
        blizzardCategory: blizzardData.category?.name?.en_US || blizzardData.category?.name || null,
        inferredCategory,
        finalCategory: blizzardData.category?.name?.en_US || blizzardData.category?.name || inferredCategory,
      },
      parsedSource,
    };
  },
});

// Test by WoW Item ID - lookup in DB and fetch Wowhead tooltip
export const testWowheadTooltip = action({
  args: {
    wowItemId: v.number(),
  },
  handler: async (ctx, args): Promise<{
    wowItemId: number;
    wowheadUrl: string;
    database: { found: boolean; decorId?: number; name?: string; category?: string | null; source?: string | null; sourceDetails?: string | null; questId?: number | null; questName?: string | null; achievementId?: number | null; achievementName?: string | null; budgetCost?: number | null };
    wowheadTooltip: any;
  }> => {
    const { wowItemId } = args;

    // Look up in our database
    type DbItem = { blizzardId: number; name: string; category?: string | null; source?: string | null; sourceDetails?: string | null; questId?: number | null; questName?: string | null; achievementId?: number | null; achievementName?: string | null; budgetCost?: number | null } | null;
    const dbItem: DbItem = await ctx.runQuery(internal.gameData.getDecorByWowItemId, { wowItemId });

    // Try fetching Wowhead tooltip data
    let wowheadTooltip: any = null;
    let wowheadError: string | null = null;

    try {
      // Wowhead's tooltip endpoint
      const tooltipUrl = `https://nether.wowhead.com/tooltip/item/${wowItemId}?dataEnv=1&locale=0`;
      const response = await fetch(tooltipUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; GearForge/1.0)",
        },
      });

      if (response.ok) {
        wowheadTooltip = await response.json();
      } else {
        wowheadError = `Status ${response.status}: ${response.statusText}`;
      }
    } catch (e: any) {
      wowheadError = e.message || String(e);
    }

    return {
      wowItemId,
      wowheadUrl: `https://www.wowhead.com/item=${wowItemId}`,
      database: dbItem ? {
        found: true,
        decorId: dbItem.blizzardId,
        name: dbItem.name,
        category: dbItem.category,
        source: dbItem.source,
        sourceDetails: dbItem.sourceDetails,
        questId: dbItem.questId,
        questName: dbItem.questName,
        achievementId: dbItem.achievementId,
        achievementName: dbItem.achievementName,
        budgetCost: dbItem.budgetCost,
      } : { found: false },
      wowheadTooltip: wowheadTooltip || { error: wowheadError },
    };
  },
});

// Helper to parse budget cost from Wowhead tooltip HTML
function parseBudgetCostFromTooltip(tooltipHtml: string): number | null {
  // Pattern: <img src="...house-decor-budget-icon.webp"...><b>NUMBER</b>
  const match = tooltipHtml.match(/house-decor-budget-icon\.webp[^>]*>[^<]*<b>(\d+)<\/b>/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Parse gold cost from Wowhead tooltip (returns copper value)
function parseGoldCostFromTooltip(tooltipHtml: string): number | null {
  // Wowhead shows gold as: <span class="moneygold">123</span><span class="moneysilver">45</span><span class="moneycopper">67</span>
  const goldMatch = tooltipHtml.match(/class="moneygold">(\d+)</);
  const silverMatch = tooltipHtml.match(/class="moneysilver">(\d+)</);
  const copperMatch = tooltipHtml.match(/class="moneycopper">(\d+)</);

  const gold = goldMatch ? parseInt(goldMatch[1], 10) : 0;
  const silver = silverMatch ? parseInt(silverMatch[1], 10) : 0;
  const copper = copperMatch ? parseInt(copperMatch[1], 10) : 0;

  const totalCopper = gold * 10000 + silver * 100 + copper;
  return totalCopper > 0 ? totalCopper : null;
}

// Parse reputation or renown requirement from Wowhead tooltip
function parseReputationFromTooltip(tooltipHtml: string): { factionName: string; standingRequired: string; isRenown?: boolean } | null {
  // Pattern 1: Renown - "Requires Renown X with <faction>"
  // e.g., "Requires Renown 12 with The Assembly of the Deeps"
  const renownMatch = tooltipHtml.match(/Requires\s+Renown\s+(\d+)\s+with\s+([^<]+?)(?:<|$|\.|,)/i);
  if (renownMatch) {
    return {
      factionName: renownMatch[2].trim(),
      standingRequired: `Renown ${renownMatch[1]}`,
      isRenown: true,
    };
  }

  // Pattern 2: Traditional reputation standings
  // e.g., "Requires The Assembly of the Deeps - Valued"
  const standingMatch = tooltipHtml.match(/Requires\s+([^<]+?)\s+-\s+(Neutral|Friendly|Honored|Revered|Exalted|Valued|Esteemed|Renowned)/i);
  if (standingMatch) {
    return {
      factionName: standingMatch[1].trim(),
      standingRequired: standingMatch[2],
    };
  }

  return null;
}

// Parse profession requirement from Wowhead tooltip
function parseProfessionFromTooltip(tooltipHtml: string): { professionName: string; skillRequired: number } | null {
  // Patterns:
  // "Requires Blacksmithing (100)"
  // "Requires Leatherworking"
  const match = tooltipHtml.match(/Requires\s+(Alchemy|Blacksmithing|Enchanting|Engineering|Herbalism|Inscription|Jewelcrafting|Leatherworking|Mining|Skinning|Tailoring|Cooking|Fishing|Archaeology)(?:\s+\((\d+)\))?/i);
  if (match) {
    return {
      professionName: match[1],
      skillRequired: match[2] ? parseInt(match[2], 10) : 1,
    };
  }
  return null;
}

// Parse quest requirement from Wowhead tooltip
function parseQuestFromTooltip(tooltipHtml: string): { questName: string } | null {
  // Pattern: Complete the quest "Quest Name"
  // e.g., 'Complete the quest "Allegiance of Kul Tiras"'
  const match = tooltipHtml.match(/Complete the quest\s*"([^"]+)"/i);
  if (match) {
    return {
      questName: match[1].trim(),
    };
  }
  return null;
}

// Parse currency cost from Wowhead tooltip
function parseCurrencyFromTooltip(tooltipHtml: string): { currencyType: string; currencyCost: number } | null {
  // Look for currency icons and amounts
  // Pattern examples: "50 Artisan's Acuity", "100 Resonance Crystals"
  // Usually appears as: <span class="...currency...">NUMBER</span> Currency Name

  // Common housing currencies
  const currencies = [
    "Artisan's Acuity",
    "Resonance Crystals",
    "Kej",
    "Valorstones",
    "Coffer Key Shards",
  ];

  for (const currency of currencies) {
    const regex = new RegExp(`(\\d+)\\s*(?:<[^>]+>)?\\s*${currency.replace(/'/g, "'")}`, "i");
    const match = tooltipHtml.match(regex);
    if (match) {
      return {
        currencyType: currency,
        currencyCost: parseInt(match[1], 10),
      };
    }
  }
  return null;
}

// Combined parsing function that extracts all available data from tooltip
interface TooltipData {
  budgetCost: number | null;
  goldCost: number | null;
  currencyType: string | null;
  currencyCost: number | null;
  reputationFaction: string | null;
  reputationStanding: string | null;
  professionName: string | null;
  professionSkillRequired: number | null;
  questName: string | null;
}

function parseAllFromTooltip(tooltipHtml: string): TooltipData {
  const budgetCost = parseBudgetCostFromTooltip(tooltipHtml);
  const goldCost = parseGoldCostFromTooltip(tooltipHtml);
  const currency = parseCurrencyFromTooltip(tooltipHtml);
  const reputation = parseReputationFromTooltip(tooltipHtml);
  const profession = parseProfessionFromTooltip(tooltipHtml);
  const quest = parseQuestFromTooltip(tooltipHtml);

  return {
    budgetCost,
    goldCost,
    currencyType: currency?.currencyType || null,
    currencyCost: currency?.currencyCost || null,
    reputationFaction: reputation?.factionName || null,
    reputationStanding: reputation?.standingRequired || null,
    professionName: profession?.professionName || null,
    professionSkillRequired: profession?.skillRequired || null,
    questName: quest?.questName || null,
  };
}

// Enrich decor items with Wowhead data (budget costs, gold costs, reputation, profession, quest requirements)
export const enrichFromWowhead = action({
  args: {
    limit: v.optional(v.number()), // How many items to enrich (default 50)
    onlyMissingBudget: v.optional(v.boolean()), // Only enrich items without budget cost
    onlyMissingNewFields: v.optional(v.boolean()), // Re-enrich items missing new tooltip data
  },
  handler: async (ctx, args): Promise<{
    processed: number;
    enriched: number;
    failed: number;
    results: Array<{
      name: string;
      budgetCost: number | null;
      goldCost: number | null;
      reputation: string | null;
      profession: string | null;
      quest: string | null;
      error?: string;
    }>;
  }> => {
    const limit = args.limit ?? 50;
    const onlyMissingBudget = args.onlyMissingBudget ?? true;

    // Get items that need enrichment
    const onlyMissingNewFields = args.onlyMissingNewFields ?? false;
    type EnrichmentItem = { blizzardId: number; name: string; wowItemId?: number };
    const allItems: EnrichmentItem[] = await ctx.runQuery(internal.gameData.getDecorItemsForEnrichment, {
      limit,
      onlyMissingBudget,
      onlyMissingNewFields,
    });

    let enriched = 0;
    let failed = 0;
    const results: Array<{
      name: string;
      budgetCost: number | null;
      goldCost: number | null;
      reputation: string | null;
      profession: string | null;
      quest: string | null;
      error?: string;
    }> = [];

    for (const item of allItems) {
      if (!item.wowItemId) {
        continue;
      }

      try {
        // Rate limit - 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Fetch Wowhead tooltip
        const tooltipUrl = `https://nether.wowhead.com/tooltip/item/${item.wowItemId}?dataEnv=1&locale=0`;
        const response = await fetch(tooltipUrl, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; GearForge/1.0)",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const tooltipData = parseAllFromTooltip(data.tooltip || "");

          // Look up quest ID if we have a quest name
          let questId: number | undefined;
          if (tooltipData.questName) {
            const questData = await ctx.runQuery(internal.gameData.getQuestByName, {
              name: tooltipData.questName,
            });
            if (questData) {
              questId = questData.questId;
            }
          }

          // Check if we got any useful data
          const hasData = tooltipData.budgetCost !== null ||
            tooltipData.goldCost !== null ||
            tooltipData.reputationFaction !== null ||
            tooltipData.professionName !== null ||
            tooltipData.currencyType !== null ||
            tooltipData.questName !== null;

          if (hasData) {
            // Update the item in database with all parsed data
            await ctx.runMutation(internal.gameData.updateDecorFromWowhead, {
              blizzardId: item.blizzardId,
              budgetCost: tooltipData.budgetCost ?? undefined,
              goldCost: tooltipData.goldCost ?? undefined,
              currencyType: tooltipData.currencyType ?? undefined,
              currencyCost: tooltipData.currencyCost ?? undefined,
              reputationFaction: tooltipData.reputationFaction ?? undefined,
              reputationStanding: tooltipData.reputationStanding ?? undefined,
              professionName: tooltipData.professionName ?? undefined,
              professionSkillRequired: tooltipData.professionSkillRequired ?? undefined,
              questName: tooltipData.questName ?? undefined,
              questId: questId,
            });
            enriched++;
            results.push({
              name: item.name,
              budgetCost: tooltipData.budgetCost,
              goldCost: tooltipData.goldCost,
              reputation: tooltipData.reputationFaction
                ? `${tooltipData.reputationFaction} - ${tooltipData.reputationStanding}`
                : null,
              profession: tooltipData.professionName
                ? `${tooltipData.professionName} (${tooltipData.professionSkillRequired})`
                : null,
              quest: tooltipData.questName
                ? `${tooltipData.questName}${questId ? ` (ID: ${questId})` : " (no ID found)"}`
                : null,
            });
          } else {
            results.push({
              name: item.name,
              budgetCost: null,
              goldCost: null,
              reputation: null,
              profession: null,
              quest: null,
              error: "No enrichable data in tooltip",
            });
          }
        } else {
          failed++;
          results.push({
            name: item.name,
            budgetCost: null,
            goldCost: null,
            reputation: null,
            profession: null,
            quest: null,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (e: any) {
        failed++;
        results.push({
          name: item.name,
          budgetCost: null,
          goldCost: null,
          reputation: null,
          profession: null,
          quest: null,
          error: e.message,
        });
      }
    }

    return {
      processed: allItems.length,
      enriched,
      failed,
      results: results.slice(0, 20), // Only return first 20 for display
    };
  },
});

// ===== INTERNAL ACTIONS - For calling from other actions =====

export const syncDecorItemsInternal = internalAction({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const region = args.region ?? "us";
    const namespace = `static-${region}`;
    const locale = "en_US";

    // Get access token
    const accessToken = await getBlizzardAccessToken(args.clientId, args.clientSecret, region);

    // Fetch decor index
    const apiUrl = region === "cn"
      ? "https://gateway.battlenet.com.cn"
      : `https://${region}.api.blizzard.com`;

    const indexResponse = await fetch(
      `${apiUrl}/data/wow/decor/index?namespace=${namespace}&locale=${locale}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch decor index: ${indexResponse.statusText}`);
    }

    const indexData = await indexResponse.json();
    // API returns "decor_items" not "decors"
    const decorList = indexData.decor_items || indexData.decors || [];

    // Fetch details for each decor item (with rate limiting)
    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < decorList.length; i += batchSize) {
      const batch = decorList.slice(i, i + batchSize);
      const items: Array<{
        blizzardId: number;
        name: string;
        description?: string;
        iconUrl?: string;
        wowItemId?: number;
        category?: string;
        source?: string;
        sourceDetails?: string;
        questId?: number;
        questName?: string;
        achievementId?: number;
        achievementName?: string;
        budgetCost?: number;
      }> = [];

      for (const decor of batch) {
        try {
          // Add small delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 50));

          const detailResponse = await fetch(
            `${apiUrl}/data/wow/decor/${decor.id}?namespace=${namespace}&locale=${locale}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (detailResponse.ok) {
            const detail = await detailResponse.json();

            // Get WoW item ID for Wowhead linking
            const wowItemId = detail.items?.id;

            // Use Wowhead's 3D model thumbnails - much higher quality than Blizzard's 56px icons
            // URL pattern: https://wow.zamimg.com/modelviewer/live/webthumbs/decor/{folder}/{decorId}.webp
            // The folder is decorId % 256 (bucketing system)
            const decorId = detail.id;
            const folder = decorId % 256;
            const iconUrl = `https://wow.zamimg.com/modelviewer/live/webthumbs/decor/${folder}/${decorId}.webp`;

            const itemName = detail.name?.en_US || detail.name || `Decor ${detail.id}`;
            // Use Blizzard's category if available, otherwise infer from name
            const category = detail.category?.name?.en_US || detail.category?.name || inferCategoryFromName(itemName);

            // Extract source info - Blizzard returns source as array of objects
            // e.g. source: [{ achievements: [{ id: 41186, name: "..." }] }]
            // or source: [{ quests: [{ id: 12345, name: "..." }] }]
            let questId: number | undefined;
            let questName: string | undefined;
            let achievementId: number | undefined;
            let achievementName: string | undefined;
            let sourceType: string | undefined;
            let sourceDetails: string | undefined;

            if (Array.isArray(detail.source)) {
              for (const src of detail.source) {
                // Check for achievements
                if (src.achievements && src.achievements.length > 0) {
                  const ach = src.achievements[0];
                  achievementId = ach.id;
                  achievementName = ach.name?.en_US || ach.name;
                  sourceType = "achievement";
                  sourceDetails = achievementName;
                }
                // Check for quests
                if (src.quests && src.quests.length > 0) {
                  const quest = src.quests[0];
                  questId = quest.id;
                  questName = quest.name?.en_US || quest.name;
                  sourceType = "quest";
                  sourceDetails = questName;
                }
                // Check for vendors
                if (src.vendors && src.vendors.length > 0) {
                  sourceType = "vendor";
                  sourceDetails = src.vendors[0].name?.en_US || src.vendors[0].name;
                }
                // Check for professions/crafting
                if (src.professions && src.professions.length > 0) {
                  sourceType = "profession";
                  sourceDetails = src.professions[0].name?.en_US || src.professions[0].name;
                }
              }
            }

            // Capture budget/placement cost if available from Blizzard
            const budgetCost = detail.budget_cost ?? detail.placement_cost ?? detail.decor_cost;

            items.push({
              blizzardId: detail.id,
              name: itemName,
              description: detail.description?.en_US || detail.description,
              iconUrl,
              wowItemId,
              category,
              source: sourceType,
              sourceDetails,
              questId,
              questName,
              achievementId,
              achievementName,
              budgetCost,
            });
          }
        } catch (e) {
          console.error(`Failed to fetch decor ${decor.id}:`, e);
        }
      }

      // Batch upsert to database
      if (items.length > 0) {
        await ctx.runMutation(internal.gameData.batchUpsertDecorItems, { items });
        processed += items.length;
      }
    }

    return { synced: processed, total: decorList.length };
  },
});

export const syncFixtureItemsInternal = internalAction({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const region = args.region ?? "us";
    const namespace = `static-${region}`;
    const locale = "en_US";

    const accessToken = await getBlizzardAccessToken(args.clientId, args.clientSecret, region);

    const apiUrl = region === "cn"
      ? "https://gateway.battlenet.com.cn"
      : `https://${region}.api.blizzard.com`;

    const indexResponse = await fetch(
      `${apiUrl}/data/wow/fixture/index?namespace=${namespace}&locale=${locale}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch fixture index: ${indexResponse.statusText}`);
    }

    const indexData = await indexResponse.json();
    // API might return "fixture_items" or "fixtures"
    const fixtureList = indexData.fixture_items || indexData.fixtures || [];

    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < fixtureList.length; i += batchSize) {
      const batch = fixtureList.slice(i, i + batchSize);
      const items = [];

      for (const fixture of batch) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 50));

          const detailResponse = await fetch(
            `${apiUrl}/data/wow/fixture/${fixture.id}?namespace=${namespace}&locale=${locale}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (detailResponse.ok) {
            const detail = await detailResponse.json();

            // Get item icon from item media endpoint
            let iconUrl: string | undefined;
            const itemId = detail.items?.id;
            if (itemId) {
              try {
                await new Promise((resolve) => setTimeout(resolve, 30));
                const mediaResponse = await fetch(
                  `${apiUrl}/data/wow/media/item/${itemId}?namespace=${namespace}&locale=${locale}`,
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (mediaResponse.ok) {
                  const mediaData = await mediaResponse.json();
                  iconUrl = mediaData.assets?.find((a: any) => a.key === "icon")?.value;
                }
              } catch (e) {
                // Ignore media fetch errors
              }
            }

            items.push({
              blizzardId: detail.id,
              name: detail.name?.en_US || detail.name || `Fixture ${detail.id}`,
              description: detail.description?.en_US || detail.description,
              iconUrl,
              category: detail.category?.name?.en_US || detail.category?.name,
            });
          }
        } catch (e) {
          console.error(`Failed to fetch fixture ${fixture.id}:`, e);
        }
      }

      if (items.length > 0) {
        await ctx.runMutation(internal.gameData.batchUpsertFixtureItems, { items });
        processed += items.length;
      }
    }

    return { synced: processed, total: fixtureList.length };
  },
});

export const syncRoomsInternal = internalAction({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const region = args.region ?? "us";
    const namespace = `static-${region}`;
    const locale = "en_US";

    const accessToken = await getBlizzardAccessToken(args.clientId, args.clientSecret, region);

    const apiUrl = region === "cn"
      ? "https://gateway.battlenet.com.cn"
      : `https://${region}.api.blizzard.com`;

    const indexResponse = await fetch(
      `${apiUrl}/data/wow/room/index?namespace=${namespace}&locale=${locale}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch room index: ${indexResponse.statusText}`);
    }

    const indexData = await indexResponse.json();
    const roomList = indexData.rooms || [];

    const items = [];

    for (const room of roomList) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 50));

        const detailResponse = await fetch(
          `${apiUrl}/data/wow/room/${room.id}?namespace=${namespace}&locale=${locale}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          items.push({
            blizzardId: detail.id,
            name: detail.name?.en_US || detail.name || `Room ${detail.id}`,
            description: detail.description?.en_US || detail.description,
          });
        }
      } catch (e) {
        console.error(`Failed to fetch room ${room.id}:`, e);
      }
    }

    if (items.length > 0) {
      await ctx.runMutation(internal.gameData.batchUpsertRooms, { items });
    }

    return { synced: items.length, total: roomList.length };
  },
});

export const syncAllGameDataInternal = internalAction({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = {
      decor: { synced: 0, total: 0 },
      fixtures: { synced: 0, total: 0 },
      rooms: { synced: 0, total: 0 },
    };

    try {
      results.decor = await ctx.runAction(internal.gameData.syncDecorItemsInternal, args);
    } catch (e) {
      console.error("Failed to sync decor:", e);
    }

    try {
      results.fixtures = await ctx.runAction(internal.gameData.syncFixtureItemsInternal, args);
    } catch (e) {
      console.error("Failed to sync fixtures:", e);
    }

    try {
      results.rooms = await ctx.runAction(internal.gameData.syncRoomsInternal, args);
    } catch (e) {
      console.error("Failed to sync rooms:", e);
    }

    return results;
  },
});

// ===== PUBLIC ACTIONS - Can be called from client/dashboard =====

type SyncResult = { synced: number; total: number };
type AllSyncResult = {
  decor: SyncResult;
  fixtures: SyncResult;
  rooms: SyncResult;
};

// Sync all decor items from Blizzard
export const syncDecorItems = action({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    return await ctx.runAction(internal.gameData.syncDecorItemsInternal, args);
  },
});

// Sync all fixture items from Blizzard
export const syncFixtureItems = action({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    return await ctx.runAction(internal.gameData.syncFixtureItemsInternal, args);
  },
});

// Sync all rooms from Blizzard
export const syncRooms = action({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    return await ctx.runAction(internal.gameData.syncRoomsInternal, args);
  },
});

// Sync all game data (decor, fixtures, rooms)
export const syncAllGameData = action({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AllSyncResult> => {
    return await ctx.runAction(internal.gameData.syncAllGameDataInternal, args);
  },
});

// ===== CHARACTER PROFILE TEST =====

// Test fetching character achievements (public data - no user login needed)
export const testCharacterAchievements = action({
  args: {
    realmSlug: v.string(), // e.g., "area-52", "illidan", "stormrage"
    characterName: v.string(), // lowercase character name
    region: v.optional(v.string()), // us, eu, kr, tw (default: us)
    achievementIds: v.optional(v.array(v.number())), // specific achievements to check
  },
  handler: async (_ctx, args): Promise<{
    character: { name: string; realm: string; level?: number; faction?: string };
    achievementSummary: { total: number; points: number };
    requestedAchievements?: Array<{ id: number; name?: string; completed: boolean; completedAt?: string }>;
    recentAchievements?: Array<{ id: number; name: string; completedAt: string }>;
    error?: string;
  }> => {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        character: { name: args.characterName, realm: args.realmSlug },
        achievementSummary: { total: 0, points: 0 },
        error: "Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET",
      };
    }

    const region = args.region || "us";
    const namespace = `profile-${region}`;
    const locale = "en_US";

    // Get access token
    const tokenUrl = region === "cn"
      ? "https://oauth.battlenet.com.cn/token"
      : "https://oauth.battle.net/token";

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      return {
        character: { name: args.characterName, realm: args.realmSlug },
        achievementSummary: { total: 0, points: 0 },
        error: `Token error: ${tokenResponse.status}`,
      };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // API base URL
    const apiUrl = region === "cn"
      ? "https://gateway.battlenet.com.cn"
      : `https://${region}.api.blizzard.com`;

    // Fetch character achievements
    const realmSlug = args.realmSlug.toLowerCase().replace(/\s+/g, "-");
    const characterName = args.characterName.toLowerCase();

    const achievementsUrl = `${apiUrl}/profile/wow/character/${realmSlug}/${characterName}/achievements?namespace=${namespace}&locale=${locale}`;

    const achievementsResponse = await fetch(achievementsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!achievementsResponse.ok) {
      const errorText = await achievementsResponse.text();
      return {
        character: { name: args.characterName, realm: args.realmSlug },
        achievementSummary: { total: 0, points: 0 },
        error: `API error ${achievementsResponse.status}: ${errorText}`,
      };
    }

    const achievementsData = await achievementsResponse.json();

    // Build completed achievements set
    const completedAchievements = new Map<number, { id: number; name?: string; completedAt?: number }>();

    if (achievementsData.achievements) {
      for (const ach of achievementsData.achievements) {
        if (ach.completed_timestamp) {
          completedAchievements.set(ach.id, {
            id: ach.id,
            name: ach.achievement?.name,
            completedAt: ach.completed_timestamp,
          });
        }
      }
    }

    // Check requested achievements
    let requestedAchievements: Array<{ id: number; name?: string; completed: boolean; completedAt?: string }> | undefined;
    if (args.achievementIds && args.achievementIds.length > 0) {
      requestedAchievements = args.achievementIds.map((id) => {
        const completed = completedAchievements.get(id);
        return {
          id,
          name: completed?.name,
          completed: !!completed,
          completedAt: completed?.completedAt
            ? new Date(completed.completedAt).toISOString()
            : undefined,
        };
      });
    }

    // Get recent achievements (last 10)
    const recentAchievements = Array.from(completedAchievements.values())
      .filter((a) => a.completedAt)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        name: a.name || `Achievement ${a.id}`,
        completedAt: new Date(a.completedAt!).toISOString(),
      }));

    return {
      character: {
        name: achievementsData.character?.name || args.characterName,
        realm: achievementsData.character?.realm?.name || args.realmSlug,
        level: achievementsData.character?.level,
      },
      achievementSummary: {
        total: completedAchievements.size,
        points: achievementsData.total_points || 0,
      },
      requestedAchievements,
      recentAchievements,
    };
  },
});

// Sync using environment variables (for admin UI)
export const syncFromEnv = action({
  args: {
    type: v.union(v.literal("all"), v.literal("decor"), v.literal("fixtures"), v.literal("rooms")),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AllSyncResult | SyncResult> => {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Blizzard API credentials not configured. Set BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET in Convex environment variables.");
    }

    const syncArgs = {
      clientId,
      clientSecret,
      region: args.region ?? "us",
    };

    switch (args.type) {
      case "decor":
        return await ctx.runAction(internal.gameData.syncDecorItemsInternal, syncArgs);
      case "fixtures":
        return await ctx.runAction(internal.gameData.syncFixtureItemsInternal, syncArgs);
      case "rooms":
        return await ctx.runAction(internal.gameData.syncRoomsInternal, syncArgs);
      case "all":
      default:
        return await ctx.runAction(internal.gameData.syncAllGameDataInternal, syncArgs);
    }
  },
});

// ===== QUEST SYNC =====

// Batch upsert quests
export const batchUpsertQuests = internalMutation({
  args: {
    quests: v.array(
      v.object({
        questId: v.number(),
        name: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let upserted = 0;

    for (const quest of args.quests) {
      const existing = await ctx.db
        .query("quests")
        .withIndex("by_quest_id", (q) => q.eq("questId", quest.questId))
        .first();

      const data = {
        questId: quest.questId,
        name: quest.name,
        nameLower: quest.name.toLowerCase(),
        cachedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        await ctx.db.insert("quests", data);
      }
      upserted++;
    }

    return { upserted };
  },
});

// Lookup quest ID by name (case-insensitive)
export const getQuestByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const nameLower = args.name.toLowerCase();
    return await ctx.db
      .query("quests")
      .withIndex("by_name_lower", (q) => q.eq("nameLower", nameLower))
      .first();
  },
});

// Get quest cache stats
export const getQuestCacheStats = query({
  handler: async (ctx) => {
    const quests = await ctx.db.query("quests").collect();
    return {
      count: quests.length,
      oldestCacheDate: quests.length > 0
        ? Math.min(...quests.map((q) => q.cachedAt))
        : null,
    };
  },
});

// Link quest names to quest IDs from our quests table
// OPTIMIZED: Only processes items that have questName but NO questId (skips already-linked items)
export const linkQuestIds = mutation({
  args: {
    forceRelink: v.optional(v.boolean()), // Set true to re-check all items, even ones with questId
  },
  handler: async (ctx, args) => {
    // Get all decor items that have a quest name
    const decorItems = await ctx.db.query("decorItems").collect();

    // OPTIMIZATION: Only process items that need linking (no questId yet)
    // Unless forceRelink is true, then process all items with questName
    const itemsToProcess = decorItems.filter((item) => {
      if (!item.questName) return false;
      if (args.forceRelink) return true;
      return !item.questId; // Only items missing questId
    });

    let linked = 0;
    let skipped = decorItems.filter((item) => item.questName && item.questId).length;
    let notFound = 0;
    const notFoundQuests: string[] = [];

    for (const item of itemsToProcess) {
      if (!item.questName) continue;

      // Look up the quest by name (case-insensitive) using indexed query
      const nameLower = item.questName.toLowerCase();
      let quest = await ctx.db
        .query("quests")
        .withIndex("by_name_lower", (q) => q.eq("nameLower", nameLower))
        .first();

      // If not found, try with "The " prefix (common pattern)
      if (!quest && !nameLower.startsWith("the ")) {
        quest = await ctx.db
          .query("quests")
          .withIndex("by_name_lower", (q) => q.eq("nameLower", "the " + nameLower))
          .first();
      }

      // If still not found, try removing "The " prefix
      if (!quest && nameLower.startsWith("the ")) {
        quest = await ctx.db
          .query("quests")
          .withIndex("by_name_lower", (q) => q.eq("nameLower", nameLower.slice(4)))
          .first();
      }

      if (quest) {
        // Only update if questId is missing or different
        if (item.questId !== quest.questId) {
          await ctx.db.patch(item._id, { questId: quest.questId });
          linked++;
        }
      } else {
        notFound++;
        if (!notFoundQuests.includes(item.questName)) {
          notFoundQuests.push(item.questName);
        }
      }
    }

    return {
      processed: itemsToProcess.length,
      skipped, // Items already linked (not re-checked)
      linked,
      notFound,
      notFoundQuests: notFoundQuests.slice(0, 20),
    };
  },
});

// Manual quest ID mappings for edge cases where names don't match exactly
const MANUAL_QUEST_MAPPINGS: Record<string, number> = {
  // Names from Wowhead tooltips -> actual quest IDs
  "I TAKE Candle!": 26229,
  "Kobold Candles": 26229,  // Alternate name for same quest
  // Add more as needed
};

// Apply manual quest ID mappings for edge cases
export const applyManualQuestMappings = mutation({
  args: {},
  handler: async (ctx) => {
    const decorItems = await ctx.db.query("decorItems").collect();
    let updated = 0;

    for (const item of decorItems) {
      if (!item.questName) continue;

      const manualId = MANUAL_QUEST_MAPPINGS[item.questName];
      if (manualId && item.questId !== manualId) {
        await ctx.db.patch(item._id, { questId: manualId });
        updated++;
      }
    }

    return { updated, mappingsAvailable: Object.keys(MANUAL_QUEST_MAPPINGS).length };
  },
});

// Get decor items with unmatched quest requirements (have questName but no questId)
// OPTIMIZED: Only checks items without questId (skips expensive DB lookups)
export const getUnmatchedQuestItems = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const decorItems = await ctx.db.query("decorItems").collect();

    // OPTIMIZATION: Only return items with questName but NO questId
    // This avoids expensive cross-table lookups for each item
    const unmatched = decorItems
      .filter((item) => item.questName && !item.questId)
      .slice(0, limit)
      .map((item) => ({
        blizzardId: item.blizzardId,
        name: item.name,
        questName: item.questName,
        questId: item.questId,
        wowItemId: item.wowItemId,
        iconUrl: item.iconUrl,
      }));

    const totalUnmatched = decorItems.filter((item) => item.questName && !item.questId).length;

    return {
      items: unmatched,
      total: totalUnmatched,
      hasMore: totalUnmatched > limit,
    };
  },
});

// Delete decor items by blizzard ID (admin utility for cleaning up test data)
export const deleteDecorItems = mutation({
  args: {
    blizzardIds: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (const blizzardId of args.blizzardIds) {
      const item = await ctx.db
        .query("decorItems")
        .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", blizzardId))
        .first();
      if (item) {
        await ctx.db.delete(item._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

// Set quest ID for a specific quest name (admin utility)
export const setQuestIdByName = mutation({
  args: {
    questName: v.string(),
    questId: v.number(),
  },
  handler: async (ctx, args) => {
    const decorItems = await ctx.db.query("decorItems").collect();
    const itemsToUpdate = decorItems.filter(
      (item) => item.questName?.toLowerCase() === args.questName.toLowerCase()
    );

    for (const item of itemsToUpdate) {
      await ctx.db.patch(item._id, { questId: args.questId });
    }

    // Also add to our quests table for future lookups
    const existingQuest = await ctx.db
      .query("quests")
      .withIndex("by_quest_id", (q) => q.eq("questId", args.questId))
      .first();

    if (!existingQuest) {
      await ctx.db.insert("quests", {
        questId: args.questId,
        name: args.questName,
        nameLower: args.questName.toLowerCase(),
        cachedAt: Date.now(),
      });
    }

    return { updated: itemsToUpdate.length, questName: args.questName, questId: args.questId };
  },
});

// Sync quests from Blizzard API
export const syncQuestsInternal = internalAction({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ synced: number }> => {
    const region = args.region ?? "us";
    const namespace = `static-${region}`;
    const locale = "en_US";

    // Get access token
    const tokenUrl = "https://oauth.battle.net/token";
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${args.clientId}:${args.clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const apiUrl = `https://${region}.api.blizzard.com`;

    // Fetch quest index
    const indexResponse = await fetch(
      `${apiUrl}/data/wow/quest/index?namespace=${namespace}&locale=${locale}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch quest index: ${indexResponse.statusText}`);
    }

    const indexData = await indexResponse.json();

    // The quest index returns categories, areas, and types
    // We fetch from BOTH categories AND areas to get all quests including old continents
    let allQuests: Array<{ questId: number; name: string }> = [];
    const seenQuestIds = new Set<number>(); // Track seen IDs to avoid duplicates
    let totalProcessed = 0;

    // Helper to add quest avoiding duplicates
    const addQuest = (id: number, name: string) => {
      if (!seenQuestIds.has(id)) {
        seenQuestIds.add(id);
        allQuests.push({ questId: id, name: name || `Quest ${id}` });
      }
    };

    // Helper to batch insert
    const flushBatch = async () => {
      if (allQuests.length >= 500) {
        await ctx.runMutation(internal.gameData.batchUpsertQuests, { quests: allQuests });
        totalProcessed += allQuests.length;
        allQuests = [];
      }
    };

    // ===== SYNC BY CATEGORY =====
    const categoriesResponse = await fetch(
      `${apiUrl}/data/wow/quest/category/index?namespace=${namespace}&locale=${locale}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.categories || [];

      for (const category of categories) {
        await new Promise((resolve) => setTimeout(resolve, 30)); // Rate limit

        const categoryResponse = await fetch(
          `${apiUrl}/data/wow/quest/category/${category.id}?namespace=${namespace}&locale=${locale}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          if (categoryData.quests && Array.isArray(categoryData.quests)) {
            for (const quest of categoryData.quests) {
              addQuest(quest.id, quest.name);
            }
          }
        }

        await flushBatch();
      }
    }

    // ===== SYNC BY AREA (zones/continents - includes old content) =====
    const areasResponse = await fetch(
      `${apiUrl}/data/wow/quest/area/index?namespace=${namespace}&locale=${locale}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (areasResponse.ok) {
      const areasData = await areasResponse.json();
      const areas = areasData.areas || [];

      console.log(`Syncing quests from ${areas.length} areas/zones...`);

      for (const area of areas) {
        await new Promise((resolve) => setTimeout(resolve, 30)); // Rate limit

        const areaResponse = await fetch(
          `${apiUrl}/data/wow/quest/area/${area.id}?namespace=${namespace}&locale=${locale}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          if (areaData.quests && Array.isArray(areaData.quests)) {
            for (const quest of areaData.quests) {
              addQuest(quest.id, quest.name);
            }
          }
        }

        await flushBatch();
      }
    }

    // Insert remaining quests
    if (allQuests.length > 0) {
      await ctx.runMutation(internal.gameData.batchUpsertQuests, { quests: allQuests });
      totalProcessed += allQuests.length;
    }

    // Get final count
    const stats: { count: number } = await ctx.runQuery(internal.gameData.getQuestCacheStatsInternal);
    return { synced: stats.count };
  },
});

// Internal query for quest stats (used by sync action)
export const getQuestCacheStatsInternal = internalQuery({
  handler: async (ctx) => {
    const quests = await ctx.db.query("quests").collect();
    return { count: quests.length };
  },
});

// Public action to sync quests
export const syncQuests = action({
  args: {
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ synced: number }> => {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Blizzard API credentials not configured.");
    }

    return await ctx.runAction(internal.gameData.syncQuestsInternal, {
      clientId,
      clientSecret,
      region: args.region ?? "us",
    });
  },
});
