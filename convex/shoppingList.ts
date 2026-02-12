import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ===== HELPER: Verify Session =====
async function verifySession(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized: Please log in");
  }

  const user = await ctx.db.get(session.userId);
  if (!user || user.banned) {
    throw new Error("Unauthorized: User not found or banned");
  }

  return user;
}

// ===== QUERIES =====

/**
 * Get user's full shopping list with enriched item data
 */
export const getList = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Enrich with decor item info and design titles
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        // Get decor item details
        const decorItem = await ctx.db
          .query("decorItems")
          .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", item.decorId))
          .first();

        // Get design titles for source designs
        const sourcesWithTitles = await Promise.all(
          item.sourceDesigns.map(async (source) => {
            const creation = await ctx.db.get(source.creationId);
            return {
              ...source,
              title: creation?.title || "Deleted Design",
              exists: !!creation,
            };
          })
        );

        return {
          _id: item._id,
          decorId: item.decorId,
          quantityNeeded: item.quantityNeeded,
          quantityAcquired: item.quantityAcquired,
          isComplete: item.quantityAcquired >= item.quantityNeeded,
          sourceDesigns: sourcesWithTitles,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          // Decor item info
          name: decorItem?.name || `Item #${item.decorId}`,
          iconUrl: decorItem?.iconUrl,
          category: decorItem?.category,
          subcategory: decorItem?.subcategory,
          source: decorItem?.source,
          sourceDetails: decorItem?.sourceDetails,
          wowItemId: decorItem?.wowItemId,
        };
      })
    );

    // Sort by name only (don't reorder based on completion status)
    enrichedItems.sort((a, b) => a.name.localeCompare(b.name));

    return enrichedItems;
  },
});

/**
 * Get summary for header badge
 */
export const getListSummary = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const totalItems = items.length;
    const totalQuantityNeeded = items.reduce((sum, i) => sum + i.quantityNeeded, 0);
    const totalQuantityAcquired = items.reduce((sum, i) => sum + i.quantityAcquired, 0);
    const incompleteCount = items.filter((i) => i.quantityAcquired < i.quantityNeeded).length;

    // Get unique design count
    const designIds = new Set<string>();
    items.forEach((item) => {
      item.sourceDesigns.forEach((source) => {
        designIds.add(source.creationId);
      });
    });

    return {
      totalItems,
      incompleteCount,
      totalQuantityNeeded,
      totalQuantityAcquired,
      designCount: designIds.size,
    };
  },
});

/**
 * Check if a design's items are in the shopping list
 */
export const isDesignInList = query({
  args: {
    sessionToken: v.string(),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Check if any item has this design as a source
    const isInList = items.some((item) =>
      item.sourceDesigns.some((source) => source.creationId === args.creationId)
    );

    return isInList;
  },
});

// ===== MUTATIONS =====

/**
 * Add all items from a design to the shopping list
 */
export const addDesign = mutation({
  args: {
    sessionToken: v.string(),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    // Get the creation
    const creation = await ctx.db.get(args.creationId);
    if (!creation) {
      throw new Error("Design not found");
    }

    if (!creation.items || creation.items.length === 0) {
      throw new Error("This design has no items to add");
    }

    const now = Date.now();
    let addedCount = 0;
    let updatedCount = 0;

    // Process each item in the creation
    for (const item of creation.items) {
      // Check if item already exists in user's shopping list
      const existing = await ctx.db
        .query("shoppingListItems")
        .withIndex("by_user_decor", (q) =>
          q.eq("userId", user._id).eq("decorId", item.decorId)
        )
        .first();

      if (existing) {
        // Check if this design is already a source
        const existingSourceIndex = existing.sourceDesigns.findIndex(
          (s) => s.creationId === args.creationId
        );

        if (existingSourceIndex >= 0) {
          // Update quantity from this design
          const oldQuantity = existing.sourceDesigns[existingSourceIndex].quantity;
          const newSourceDesigns = [...existing.sourceDesigns];
          newSourceDesigns[existingSourceIndex] = {
            ...newSourceDesigns[existingSourceIndex],
            quantity: item.quantity,
            addedAt: now,
          };

          await ctx.db.patch(existing._id, {
            quantityNeeded: existing.quantityNeeded - oldQuantity + item.quantity,
            sourceDesigns: newSourceDesigns,
            updatedAt: now,
          });
        } else {
          // Add this design as a new source
          await ctx.db.patch(existing._id, {
            quantityNeeded: existing.quantityNeeded + item.quantity,
            sourceDesigns: [
              ...existing.sourceDesigns,
              {
                creationId: args.creationId,
                quantity: item.quantity,
                addedAt: now,
              },
            ],
            updatedAt: now,
          });
        }
        updatedCount++;
      } else {
        // Create new shopping list item
        await ctx.db.insert("shoppingListItems", {
          userId: user._id,
          decorId: item.decorId,
          quantityNeeded: item.quantity,
          quantityAcquired: 0,
          sourceDesigns: [
            {
              creationId: args.creationId,
              quantity: item.quantity,
              addedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        });
        addedCount++;
      }
    }

    return {
      success: true,
      addedCount,
      updatedCount,
      totalItems: creation.items.length,
    };
  },
});

/**
 * Remove a design's items from the shopping list
 */
export const removeDesign = mutation({
  args: {
    sessionToken: v.string(),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    let removedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const sourceIndex = item.sourceDesigns.findIndex(
        (s) => s.creationId === args.creationId
      );

      if (sourceIndex >= 0) {
        const sourceQuantity = item.sourceDesigns[sourceIndex].quantity;
        const newSourceDesigns = item.sourceDesigns.filter(
          (s) => s.creationId !== args.creationId
        );

        if (newSourceDesigns.length === 0) {
          // Remove the entire item
          await ctx.db.delete(item._id);
          removedCount++;
        } else {
          // Update quantities
          await ctx.db.patch(item._id, {
            quantityNeeded: item.quantityNeeded - sourceQuantity,
            sourceDesigns: newSourceDesigns,
            updatedAt: now,
          });
          updatedCount++;
        }
      }
    }

    return { success: true, removedCount, updatedCount };
  },
});

/**
 * Update acquired quantity for an item
 */
export const updateAcquired = mutation({
  args: {
    sessionToken: v.string(),
    decorId: v.number(),
    quantityAcquired: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    if (args.quantityAcquired < 0) {
      throw new Error("Quantity cannot be negative");
    }

    const item = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user_decor", (q) =>
        q.eq("userId", user._id).eq("decorId", args.decorId)
      )
      .first();

    if (!item) {
      throw new Error("Item not found in shopping list");
    }

    await ctx.db.patch(item._id, {
      quantityAcquired: Math.min(args.quantityAcquired, item.quantityNeeded),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Toggle item complete/incomplete
 */
export const toggleItemComplete = mutation({
  args: {
    sessionToken: v.string(),
    decorId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const item = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user_decor", (q) =>
        q.eq("userId", user._id).eq("decorId", args.decorId)
      )
      .first();

    if (!item) {
      throw new Error("Item not found in shopping list");
    }

    const isComplete = item.quantityAcquired >= item.quantityNeeded;

    await ctx.db.patch(item._id, {
      quantityAcquired: isComplete ? 0 : item.quantityNeeded,
      updatedAt: Date.now(),
    });

    return { success: true, nowComplete: !isComplete };
  },
});

/**
 * Remove a single item from the list
 */
export const removeItem = mutation({
  args: {
    sessionToken: v.string(),
    decorId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const item = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user_decor", (q) =>
        q.eq("userId", user._id).eq("decorId", args.decorId)
      )
      .first();

    if (!item) {
      throw new Error("Item not found in shopping list");
    }

    await ctx.db.delete(item._id);

    return { success: true };
  },
});

/**
 * Clear all completed items
 */
export const clearCompleted = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let clearedCount = 0;

    for (const item of items) {
      if (item.quantityAcquired >= item.quantityNeeded) {
        await ctx.db.delete(item._id);
        clearedCount++;
      }
    }

    return { success: true, clearedCount };
  },
});

/**
 * Clear entire shopping list
 */
export const clearAll = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return { success: true, clearedCount: items.length };
  },
});
