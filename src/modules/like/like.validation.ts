import { z } from "zod";

export const likeActionSchema = z.object({
  params: z.object({
    postId: z.string().trim().uuid("Post ID format is invalid"),
  }),
});

export type LikeActionParams = z.infer<typeof likeActionSchema>["params"];
