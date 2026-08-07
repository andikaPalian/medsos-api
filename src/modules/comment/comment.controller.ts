import { Request, Response } from "express";
import { commentService as defaultCommentService } from "./comment.service.js";
import { sendCreated, sendSuccess, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import {
  CommentOnPostBody,
  CommentOnPostParams,
  DeleteCommentParams,
  GetCommentsByPostParams,
  GetCommentsByPostQuery,
  ReplyToCommentBody,
  ReplyToCommentParams,
} from "./comment.validation.js";

export const createCommentController = (service = defaultCommentService) => ({
  commentOnPost: async (
    req: Request<CommentOnPostParams, unknown, CommentOnPostBody>,
    res: Response,
  ): Promise<void> => {
    const authorId = req.user!.id;
    const authorUsername = req.user!.username;
    const { postId } = req.params;
    const { content } = req.body;

    const comment = await service.commentOnPost({
      authorId,
      authorUsername,
      postId,
      content,
    });

    sendCreated(res, comment, "Comment created successfully");
  },

  replyToComment: async (
    req: Request<ReplyToCommentParams, unknown, ReplyToCommentBody>,
    res: Response,
  ): Promise<void> => {
    const authorId = req.user!.id;
    const authorUsername = req.user!.username;
    const { postId, commentId } = req.params;
    const { content } = req.body;

    const reply = await service.replyToComment({
      authorId,
      authorUsername,
      postId,
      commentId,
      content,
    });

    sendCreated(res, reply, "Reply created successfully");
  },

  deleteComment: async (
    req: Request<DeleteCommentParams>,
    res: Response,
  ): Promise<void> => {
    const authorId = req.user!.id;
    const { commentId } = req.params;

    await service.deleteComment(authorId, commentId);
    sendEmptySuccess(res, "Comment deleted successfully");
  },

  getCommentsByPost: async (
    req: Request<GetCommentsByPostParams, unknown, unknown, GetCommentsByPostQuery>,
    res: Response,
  ): Promise<void> => {
    const viewerId = req.user!.id;
    const { postId } = req.params;
    const { limit, cursor } = req.query;

    const comments = await service.getCommentsByPost({
      viewerId,
      postId,
      limit: limit ? Number(limit) : 10,
      cursor: cursor ?? null,
    });

    sendSuccess(res, comments, "Comments retrieved successfully");
  },
});

export type CommentController = ReturnType<typeof createCommentController>;
export const commentController = createCommentController();
