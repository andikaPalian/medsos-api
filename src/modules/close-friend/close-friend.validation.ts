import { z } from "zod";

export const closeFriendActionSchema = z.object({
  params: z.object({
    friendId: z.string().trim().uuid("Friend ID format is invalid"),
  }),
});

export type CloseFriendActionParams = z.infer<typeof closeFriendActionSchema>["params"];
