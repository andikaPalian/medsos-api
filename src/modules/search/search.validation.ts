import { z } from "zod";

export const searchUsersSchema = z.object({
  query: z.object({
    search: z.string().trim().optional().default(""),
    page: z.coerce.number().positive().optional().default(1),
    limit: z.coerce.number().positive().optional().default(10),
  }),
});

export type SearchUsersQuery = z.infer<typeof searchUsersSchema>["query"];
