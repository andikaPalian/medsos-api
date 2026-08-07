import { z } from "zod";

const targetUserIdParamSchema = z.object({
  targetUserId: z.string().trim().uuid("Target User ID format is invalid"),
});

const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().positive().optional(),
  cursor: z.string().trim().optional(),
});

export const listFollowRelationsSchema = z.object({
  params: targetUserIdParamSchema,
  query: cursorPaginationQuerySchema.extend({
    direction: z.enum(["FOLLOWERS", "FOLLOWING"]).default("FOLLOWERS"),
  }),
});

export const listFollowRequestSchema = z.object({
  params: targetUserIdParamSchema,
  query: cursorPaginationQuerySchema,
});

export const followActionSchema = z.object({
  params: targetUserIdParamSchema,
});

export type ListFollowRelationsParams = z.infer<typeof listFollowRelationsSchema>["params"];
export type ListFollowRelationsQuery = z.infer<typeof listFollowRelationsSchema>["query"];
export type ListFollowRequestParams = z.infer<typeof listFollowRequestSchema>["params"];
export type ListFollowRequestQuery = z.infer<typeof listFollowRequestSchema>["query"];
export type FollowActionParams = z.infer<typeof followActionSchema>["params"];
