import { z } from "zod";

export const targetUserIdParamSchema = z.object({
  targetUserId: z.string().trim().uuid({ message: "Target User ID format is not valid." }),
});
