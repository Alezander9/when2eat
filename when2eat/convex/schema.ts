import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.id("users"),
    sunetId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    calUsername: v.optional(v.string()),
    eventSlugs: v.optional(v.array(v.string())),
  })
    .index("by_userId", ["userId"])
    .index("by_sunetId", ["sunetId"]),
});
