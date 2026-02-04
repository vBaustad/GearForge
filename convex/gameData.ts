import { query, action, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ===== QUERIES - Read from local cache =====

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

    // Search filter (case-insensitive name search)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
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

  const response = await fetch(tokenUrl, {
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
      },
      processing: {
        name: itemName,
        blizzardCategory: blizzardData.category?.name?.en_US || blizzardData.category?.name || null,
        inferredCategory,
        finalCategory: blizzardData.category?.name?.en_US || blizzardData.category?.name || inferredCategory,
      },
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
      const items = [];

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

            items.push({
              blizzardId: detail.id,
              name: itemName,
              description: detail.description?.en_US || detail.description,
              iconUrl,
              wowItemId,
              category,
              source: detail.source?.type,
              sourceDetails: detail.source?.name?.en_US || detail.source?.name,
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
