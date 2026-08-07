import { z } from "zod";

export const createStorySchema = z.object({
  body: z.object({
    isCloseFriends: z.boolean().default(false),
  }),
});

export const storyActionSchema = z.object({
  params: z.object({
    storyId: z.string().trim().uuid("Story ID format is not valid"),
  }),
});

export type CreateStoryBody = z.infer<typeof createStorySchema>["body"];
export type StoryParams = z.infer<typeof storyActionSchema>["params"];
