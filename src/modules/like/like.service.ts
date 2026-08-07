import { DuplicateEntryError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { notifiyTarget } from "@modules/notification/notification.service.js";
import { LikePostDTO } from "./dto/like-request.dto.js";
import { likeRepository as defaultLikeRepo } from "./like.repository.js";
import { postService as defaultPostService } from "@modules/post/post.service.js";

export const createLikeService = (
  likeRepo = defaultLikeRepo,
  postService = defaultPostService,
) => ({
  likePost: async ({ userId, username, postId }: LikePostDTO): Promise<void> => {
    const post = await postService.getViewablePost(userId, postId);

    try {
      await likeRepo.addLike(userId, postId);
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
  },

  unlikePost: async (userId: string, postId: string): Promise<void> => {
    const like = await likeRepo.findLike(userId, postId);
    if (!like) return;

    await likeRepo.removeLike(userId, postId);
    logger.info(`[LIKE SERVICE] Post unliked: ${postId} by ${userId}`);
  },
});

export type LikeService = ReturnType<typeof createLikeService>;
export const likeService = createLikeService();
