import { z } from "zod";

const postIdParamSchema = z.object({
  postId: z.string().trim().uuid("Post ID format is invalid"),
});

const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().positive().optional(),
  cursor: z.string().trim().optional(),
});

export const commentOnPostSchema = z.object({
  params: postIdParamSchema,
  body: z.object({
    content: z.string().trim().min(1, "Comment cannot be empty").max(5000, "Comment too long"),
  }),
});

export const replyToCommentSchema = z.object({
  params: postIdParamSchema.extend({
    commentId: z.string().trim().uuid("Comment ID format is not valid"),
  }),
  body: z.object({
    content: z.string().trim().min(1, "Reply cannot be empty").max(5000, "Comment too long"),
  }),
});

export const getCommentsByPostSchema = z.object({
  params: postIdParamSchema,
  query: cursorPaginationQuerySchema,
});

export const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z.string().trim().uuid("Comment ID format is not valid"),
  }),
});

export type CommentOnPostParams = z.infer<typeof commentOnPostSchema>["params"];
export type CommentOnPostBody = z.infer<typeof commentOnPostSchema>["body"];
export type ReplyToCommentParams = z.infer<typeof replyToCommentSchema>["params"];
export type ReplyToCommentBody = z.infer<typeof replyToCommentSchema>["body"];
export type GetCommentsByPostParams = z.infer<typeof getCommentsByPostSchema>["params"];
export type GetCommentsByPostQuery = z.infer<typeof getCommentsByPostSchema>["query"];
export type DeleteCommentParams = z.infer<typeof deleteCommentSchema>["params"];
