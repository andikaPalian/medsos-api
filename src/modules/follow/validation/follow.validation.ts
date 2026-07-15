import { z } from "zod";
import { targetUserIdParamSchema } from "../../../common/validation/shared.validation.js";
import { cursorPaginationQuerySchema } from "../../../common/validation/pagination.validation.js";

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
