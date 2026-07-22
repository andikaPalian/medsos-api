import { z } from "zod";
import { postIdParamSchema } from "../../../common/validation/shared.validation.js";
import { cursorPaginationQuerySchema } from "../../../common/validation/pagination.validation.js";

export const createPostSchema = z.object({
  body: z.object({
    caption: z.string().trim().max(5000, "Caption too long").optional(),
  }),
});

export const updatePostSchema = z.object({
  params: postIdParamSchema,
  body: z.object({
    caption: z.string().trim().max(5000, "Caption too long").optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const deletePostSchema = z.object({
  params: postIdParamSchema,
});

export const getPostByIdSchema = z.object({
  params: postIdParamSchema,
});

export const getFeedSchema = z.object({
  query: cursorPaginationQuerySchema,
});

export const savePostSchema = z.object({
  params: postIdParamSchema,
});

export const unsavedPostSchema = z.object({
  params: postIdParamSchema,
});

export const getSavedPostsSchema = z.object({
  query: cursorPaginationQuerySchema,
});

export type CreatePostBody = z.infer<typeof createPostSchema>["body"];

export type UpdatePostParams = z.infer<typeof updatePostSchema>["params"];
export type UpdatePostBody = z.infer<typeof updatePostSchema>["body"];

export type DeletePostParams = z.infer<typeof deletePostSchema>["params"];

export type GetPostByIdParams = z.infer<typeof getPostByIdSchema>["params"];

export type GetFeedQuery = z.infer<typeof getFeedSchema>["query"];

export type SavePostParams = z.infer<typeof savePostSchema>["params"];

export type UnsavedPostParams = z.infer<typeof unsavedPostSchema>["params"];

export type GetSavedPostsQuery = z.infer<typeof getSavedPostsSchema>["query"];
