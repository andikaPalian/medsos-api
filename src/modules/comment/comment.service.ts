import { NotFoundError, ForbiddenError } from "@core/errors/index.js";
import { commentRepository as defaultCommentRepo, CommentWithReplies } from "./comment.repository.js";
import { postService as defaultPostService } from "../post/post.service.js";
import { CommentResponseDTO, PaginatedCommentDTO } from "./dto/comment-response.dto.js";
import { CreateCommentDTO, CreateReplyDTO, GetCommentstDTO } from "./dto/comment-request.dto.js";
import { logger } from "@core/utils/logger.js";
import { paginateCursor, clampLimit } from "@core/utils/pagination.util.js";
import { PAGINATION } from "@core/constants/app.constants.js";
import { notifiyTarget } from "@modules/notification/notification.service.js";

const mapComment = (comment: CommentWithReplies): CommentResponseDTO => ({
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

export const createCommentService = (
  commentRepo = defaultCommentRepo,
  postService = defaultPostService,
) => ({
  commentOnPost: async ({
    authorId,
    authorUsername,
    postId,
    content,
  }: CreateCommentDTO): Promise<CommentResponseDTO> => {
    const post = await postService.getViewablePost(authorId, postId);

    const comment = await commentRepo.createComment({ authorId, postId, content });

    if (post.authorId !== authorId) {
      notifiyTarget({
        targetUserId: post.authorId,
        senderId: authorId,
        senderUsername: authorUsername,
        postId,
        storyId: null,
        type: "COMMENT",
      });
    }

    logger.info(`[COMMENT SERVICE] Post commented: ${postId} by ${authorId}`);
    return mapComment(comment);
  },

  replyToComment: async ({
    authorId,
    authorUsername,
    postId,
    commentId,
    content,
  }: CreateReplyDTO): Promise<CommentResponseDTO> => {
    await postService.getViewablePost(authorId, postId);

    const parentComment = await commentRepo.findCommentById(commentId);
    if (!parentComment || parentComment.postId !== postId) {
      throw new NotFoundError("Parent comment in this post");
    }

    const reply = await commentRepo.createComment({
      authorId,
      postId,
      content,
      parentId: commentId,
    });

    if (parentComment.authorId !== authorId) {
      notifiyTarget({
        targetUserId: parentComment.authorId,
        senderId: authorId,
        senderUsername: authorUsername,
        postId,
        storyId: null,
        type: "COMMENT",
      });
    }

    logger.info(`[COMMENT SERVICE] Comment replied: ${commentId} by ${authorId}`);
    return mapComment(reply);
  },

  getCommentsByPost: async ({
    viewerId,
    postId,
    limit,
    cursor,
  }: GetCommentstDTO): Promise<PaginatedCommentDTO> => {
    const take = clampLimit(limit, PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    await postService.getViewablePost(viewerId, postId);

    const rawComments = await commentRepo.findCommentsByPost({
      postId,
      take: take + 1,
      cursor,
    });

    const { items, nextCursor, hasNextPage } = paginateCursor(rawComments, take, (c) => c.id);
    const data = items.map(mapComment);

    return { data, nextCursor, hasNextPage };
  },

  deleteComment: async (userId: string, commentId: string): Promise<void> => {
    const comment = await commentRepo.findCommentById(commentId);
    if (!comment) throw new NotFoundError("Comment");

    if (comment.authorId !== userId) {
      throw new ForbiddenError("You are not the author of this comment");
    }

    await commentRepo.deleteComment(commentId);
    logger.info(`[COMMENT SERVICE] Comment deleted: ${commentId} by ${userId}`);
  },
});

export type CommentService = ReturnType<typeof createCommentService>;
export const commentService = createCommentService();
