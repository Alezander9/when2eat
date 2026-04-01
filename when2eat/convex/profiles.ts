import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMy = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("No email found");
    if (!user.email.endsWith("@stanford.edu")) {
      throw new Error("Only @stanford.edu emails allowed");
    }

    const sunetId = user.email.replace("@stanford.edu", "");
    return await ctx.db.insert("profiles", {
      userId,
      sunetId,
      email: user.email,
    });
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    calUsername: v.optional(v.string()),
    eventSlugs: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("No profile found");

    await ctx.db.patch(profile._id, args);
  },
});

export const getBySunetId = query({
  args: { sunetId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_sunetId", (q) => q.eq("sunetId", args.sunetId))
      .unique();
  },
});
