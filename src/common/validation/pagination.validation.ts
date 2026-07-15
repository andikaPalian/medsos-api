import { z } from "zod";

export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().trim().uuid({ message: "Cursor must be a valid UUID." }).optional(),
  limit: z.coerce
    .number()
    .positive("Limit must be a positive number")
    .max(100, "Max limit is 100")
    .default(30),
});
