import { z } from "zod";
import { postIdParamSchema } from "../../../common/validation/shared.validation.js";

export const reportPostSchema = z.object({
  params: postIdParamSchema,
  body: z.object({
    reason: z.string().trim().min(1).max(5000, "Reason too long"),
  }),
});

export type ReportPostParams = z.infer<typeof reportPostSchema>["params"];
export type ReportPostBody = z.infer<typeof reportPostSchema>["body"];
