import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const updateUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .max(50, "Username too long")
      .regex(usernameRegex, "Username can only contain letters, number, and underscores")
      .optional(),
    fullName: z
      .string()
      .min(1, "Full name is required")
      .trim()
      .max(100, "Full name too long")
      .optional(),
    bio: z.string().trim().min(1, "Bio is required").max(1000, "Bio too long").optional(),
    isPrivate: z.boolean().optional(),
  }),
});

export const getProfileParams = z.object({
  params: z.object({
    targetUserId: z.string().trim().uuid(),
  }),
});
