import { mutation } from "./_generated/server";

// Clear all data from the database
export const clearAllData = mutation({
  handler: async (ctx) => {
    // Clear all tables
    const creations = await ctx.db.query("creations").collect();
    const users = await ctx.db.query("users").collect();
    const likes = await ctx.db.query("likes").collect();
    const saves = await ctx.db.query("saves").collect();
    const sessions = await ctx.db.query("sessions").collect();
    const reports = await ctx.db.query("reports").collect();

    for (const item of creations) {
      await ctx.db.delete(item._id);
    }
    for (const item of users) {
      await ctx.db.delete(item._id);
    }
    for (const item of likes) {
      await ctx.db.delete(item._id);
    }
    for (const item of saves) {
      await ctx.db.delete(item._id);
    }
    for (const item of sessions) {
      await ctx.db.delete(item._id);
    }
    for (const item of reports) {
      await ctx.db.delete(item._id);
    }

    return {
      message: "Cleared all data",
      deleted: {
        creations: creations.length,
        users: users.length,
        likes: likes.length,
        saves: saves.length,
        sessions: sessions.length,
        reports: reports.length,
      }
    };
  },
});
