import * as likeRepository from "../repositories/like.repository.js";
import * as postRepository from "../../post/repositories/post.repository.js";
import * as notificationRepository from "../../notification/repositories/notification.repository.js";
import { AppError } from "../../../common/error/errorHandler.js";
import { getViewablePost } from "../../post/services/post.service.js";
import { DuplicateEntryError } from "../../../common/error/domain.error.js";
import { logger } from "../../../common/utils/logger.js";

export const likePost = async (userId: string, postId: string): Promise<void> => {
  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  await getViewablePost(userId, postId);

  try {
    await likeRepository.addLike(userId, postId);
  } catch (error) {
    if (error instanceof DuplicateEntryError) return;
    throw error;
  }

  if (post.authorId !== userId) {
    await notificationRepository.createNotification({
      userId: post.authorId,
      senderId: userId,
      type: "LIKE",
      postId: postId,
      message: `${userId} liked your post`,
    });
  }

  logger.info(`[LIKE SERVICE] Post liked: ${postId} by ${userId}`);
};

export const unlikePost = async (userId: string, postId: string): Promise<void> => {
  const like = await likeRepository.findLike(userId, postId);
  if (!like) return;

  await likeRepository.removeLike(userId, postId);

  logger.info(`[LIKE SERVICE] Post unliked: ${postId} by ${userId}`);
};
