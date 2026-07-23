import * as commentRepository from "../repositories/comment.repository.js";
import * as postRepository from "../../post/repositories/post.repository.js";
import * as notificationRepository from "../../notification/repositories/notification.repository.js";
import { CommentResponseDTO, PaginatedCommentDTO } from "../dto/comment-response.dto.js";
import { AppError } from "../../../common/error/errorHandler.js";
import { getViewablePost } from "../../post/services/post.service.js";
import { CreateCommentDTO, CreateReplyDTO, GetCommentstDTO } from "../dto/comment-request.dto.js";
import { logger } from "../../../common/utils/logger.js";
import { paginateCursor } from "../../../common/utils/pagination.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const mapComment = (comment: commentRepository.CommentWithReplies): CommentResponseDTO => ({
  id: comment.id,
  content: comment.content,
  createdAt: comment.createdAt,
  author: comment.author,
  totalReplies: comment._count.replies,
  replies: comment.replies.map((reply) => ({
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt,
    author: reply.author,
  })),
});

export const commentOnPost = async ({
  authorId,
  postId,
  content,
}: CreateCommentDTO): Promise<CommentResponseDTO> => {
  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  await getViewablePost(authorId, postId);

  const comment = await commentRepository.createComment({
    authorId,
    postId,
    content,
  });

  if (post.authorId !== authorId) {
    await notificationRepository.createNotification({
      userId: post.authorId,
      senderId: authorId,
      type: "COMMENT",
      postId: postId,
      message: `${authorId} commented on your post`,
    });
  }

  logger.info(`[COMMENT SERVICE] Post commented: ${postId} by ${authorId}`);

  return mapComment(comment);
};

export const replyToComment = async ({
  authorId,
  postId,
  commentId,
  content,
}: CreateReplyDTO): Promise<CommentResponseDTO> => {
  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  await getViewablePost(authorId, postId);

  const parentComment = await commentRepository.findCommentById(commentId);
  if (!parentComment || parentComment.postId !== postId) {
    throw new AppError("Parent comment not found in this post", 404);
  }

  const reply = await commentRepository.createComment({
    authorId,
    postId,
    content,
    parentId: commentId,
  });

  if (parentComment.authorId !== authorId) {
    await notificationRepository.createNotification({
      userId: parentComment.authorId,
      senderId: authorId,
      type: "COMMENT",
      postId,
      message: `${authorId} replied to your comment`,
    });
  }

  logger.info(`[COMMENT SERVICE] Comment replied: ${commentId} by ${authorId}`);

  return mapComment(reply);
};

export const getCommentsByPost = async ({
  viewerId,
  postId,
  limit,
  cursor,
}: GetCommentstDTO): Promise<PaginatedCommentDTO> => {
  const take = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));

  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  await getViewablePost(viewerId, postId);

  const rawComments = await commentRepository.findCommentsByPost({
    postId,
    take: take + 1,
    cursor,
  });
  const { items, nextCursor, hasNextPage } = paginateCursor(rawComments, take, (c) => c.id);

  const data = items.map(mapComment);

  return {
    data,
    nextCursor,
    hasNextPage,
  };
};

export const deleteComment = async (userId: string, commentId: string): Promise<void> => {
  const comment = await commentRepository.findCommentById(commentId);
  if (!comment) throw new AppError("Comment not found", 404);

  if (comment.authorId !== userId) {
    throw new AppError("Unauthorized: You are not the author of this comment", 403);
  }

  await commentRepository.deleteComment(commentId);

  logger.info(`[COMMENT SERVICE] Comment deleted: ${commentId} by ${userId}`);
};
