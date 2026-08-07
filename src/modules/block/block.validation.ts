import { z } from "zod";

export const blockActionSchema = z.object({
  params: z.object({
    targetUserId: z.string().trim().uuid("Target User ID format is invalid"),
  }),
});

export type BlockActionParams = z.infer<typeof blockActionSchema>["params"];
