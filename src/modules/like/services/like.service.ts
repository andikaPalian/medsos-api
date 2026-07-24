import * as likeRepository from "../repositories/like.repository.js";
import { getViewablePost } from "../../post/services/post.service.js";
import { DuplicateEntryError } from "../../../common/error/domain.error.js";
import { logger } from "../../../common/utils/logger.js";
import { notifiyTarget } from "../../notification/services/notification.service.js";
import { LikePostDTO } from "../dto/like-request.dto.js";

export const likePost = async ({ userId, username, postId }: LikePostDTO): Promise<void> => {
  const post = await getViewablePost(userId, postId);

  try {
    await likeRepository.addLike(userId, postId);
  } catch (error) {
    if (error instanceof DuplicateEntryError) return;
    throw error;
  }

  if (post.authorId !== userId) {
    notifiyTarget({
      targetUserId: post.authorId,
      senderId: userId,
      senderUsername: username,
      postId,
      storyId: null,
      type: "LIKE",
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
