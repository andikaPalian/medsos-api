import { z } from "zod";
import { postIdParamSchema } from "../../../common/validation/shared.validation.js";
import { cursorPaginationQuerySchema } from "../../../common/validation/pagination.validation.js";

export const commentOnPostSchema = z.object({
  params: postIdParamSchema,
  body: z.object({
    content: z.string().trim().min(1).max(5000, "Comment too long"),
  }),
});

export const replyToCommentSchema = z.object({
  params: postIdParamSchema.extend({
    commentId: z.string().trim().uuid({ message: "Comment ID format is not valid." }),
  }),
  body: z.object({
    content: z.string().trim().min(1).max(5000, "Comment too long"),
  }),
});

export const getCommentsByPostSchema = z.object({
  params: postIdParamSchema,
  query: cursorPaginationQuerySchema,
});

export const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z.string().trim().uuid({ message: "Comment ID format is not valid." }),
  }),
});

export type CommentOnPostParams = z.infer<typeof commentOnPostSchema>["params"];
export type CommentOnPostBody = z.infer<typeof commentOnPostSchema>["body"];

export type ReplyToCommentParams = z.infer<typeof replyToCommentSchema>["params"];
export type ReplyToCommentBody = z.infer<typeof replyToCommentSchema>["body"];

export type GetCommentsByPostParams = z.infer<typeof getCommentsByPostSchema>["params"];
export type GetCommentsByPostQuery = z.infer<typeof getCommentsByPostSchema>["query"];

export type DeleteCommentParams = z.infer<typeof deleteCommentSchema>["params"];
