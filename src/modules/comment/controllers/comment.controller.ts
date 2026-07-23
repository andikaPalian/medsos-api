import { Response } from "express";
import * as commentService from "../services/comment.service.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import {
  CommentOnPostBody,
  CommentOnPostParams,
  DeleteCommentParams,
  GetCommentsByPostParams,
  GetCommentsByPostQuery,
  ReplyToCommentBody,
  ReplyToCommentParams,
} from "../validations/comment.validator.js";

export const commentOnPost = authHandler(
  async (
    req: AuthenticatedRequest<CommentOnPostParams, any, CommentOnPostBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;

    const comment = await commentService.commentOnPost({
      authorId: userId,
      postId,
      content,
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  },
);

export const replyToComment = authHandler(
  async (
    req: AuthenticatedRequest<ReplyToCommentParams, any, ReplyToCommentBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId, commentId } = req.params;
    const { content } = req.body;

    const comment = await commentService.replyToComment({
      authorId: userId,
      postId,
      commentId,
      content,
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  },
);

export const getCommentsByPost = authHandler(
  async (
    req: AuthenticatedRequest<GetCommentsByPostParams, any, any, any, GetCommentsByPostQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;
    const { limit, cursor } = req.validatedQuery;

    const comments = await commentService.getCommentsByPost({
      viewerId: userId,
      postId,
      limit,
      cursor: cursor ?? null,
    });

    res.status(200).json({
      success: true,
      data: comments,
    });
  },
);

export const deleteComment = authHandler(
  async (
    req: AuthenticatedRequest<DeleteCommentParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { commentId } = req.params;

    await commentService.deleteComment(userId, commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: { commentId },
    });
  },
);
