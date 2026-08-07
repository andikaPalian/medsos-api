import { z } from "zod";

const postIdParamSchema = z.object({
  postId: z.string().trim().uuid("Post ID format is invalid"),
});

const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().positive().optional(),
  cursor: z.string().trim().optional(),
});

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
