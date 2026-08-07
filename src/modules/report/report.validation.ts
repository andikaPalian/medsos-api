import { z } from "zod";

export const reportPostSchema = z.object({
  params: z.object({
    postId: z.string().trim().uuid("Post ID format is invalid"),
  }),
  body: z.object({
    reason: z.string().trim().min(1, "Reason is required").max(5000, "Reason too long"),
  }),
});

export type ReportPostParams = z.infer<typeof reportPostSchema>["params"];
export type ReportPostBody = z.infer<typeof reportPostSchema>["body"];
