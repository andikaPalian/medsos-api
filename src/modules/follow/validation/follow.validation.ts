import { z } from "zod";

export const listFollowRelationsSchema = z.object({
  params: z.object({
    targetUserId: z.string().trim().uuid({ message: "Target User ID format is not valid." }),
  }),
  query: z.object({
    direction: z.enum(["FOLLOWERS", "FOLLOWING"]).default("FOLLOWING"),
    cursor: z.string().trim().uuid({ message: "Cursor must be a valid UUID." }),
    limit: z.coerce
      .number()
      .positive("Limit must be a positive number")
      .max(100, "Max limit is 100")
      .default(30),
  }),
});

export type ListFollowRelationsParams = z.infer<typeof listFollowRelationsSchema>["params"];
export type ListFollowRelationsQuery = z.infer<typeof listFollowRelationsSchema>["query"];

export const followRequestSchema = z.object({
  params: z.object({
    targetUserId: z.string().trim().uuid({ message: "Target User ID format is not valid." }),
  }),
  query: z.object({
    cursor: z.string().trim().uuid({ message: "Cursor must be valid UUID" }),
    limit: z.coerce
      .number()
      .positive("Limit must be a positive number")
      .max(100, "Max limit is 100")
      .default(30),
  }),
});

export type ListFollowRequestParams = z.infer<typeof followRequestSchema>["params"];
export type ListFollowRequestQuery = z.infer<typeof followRequestSchema>["query"];

export type FollowParams = z.infer<typeof followRequestSchema>["params"];
