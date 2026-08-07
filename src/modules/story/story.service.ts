import { NotFoundError, ForbiddenError, BadRequestError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { deleteFromCloudinary } from "@core/utils/cloudinary.util.js";
import { STORY } from "@core/constants/app.constants.js";
import { CreateStoryInput } from "./dto/story-request.dto.js";
import { StoryResponseDTO, StoryViewerResponseDTO } from "./dto/story-response.dto.js";
import { storyRepository as defaultStoryRepo, StoryWithDetails } from "./story.repository.js";
import { blockRepository as defaultBlockRepo } from "@modules/block/block.repository.js";
import { followRepository as defaultFollowRepo } from "@modules/follow/follow.repository.js";
import { closeFriendRepository as defaultCloseFriendRepo } from "@modules/close-friend/close-friend.repository.js";

const mapStoryResponse = (story: StoryWithDetails): StoryResponseDTO => ({
  id: story.id,
  userId: story.userId,
  isCloseFriends: story.isCloseFriends,
  user: {
    id: story.user.id,
    username: story.user.username,
    profilePic: story.user.profilePic,
  },
  media: story.media.map((m) => ({
    id: m.id,
    url: m.url,
    type: m.type,
  })),
  createdAt: story.createdAt,
  expiresAt: story.expiresAt,
});

export const createStoryService = (
  storyRepo = defaultStoryRepo,
  blockRepo = defaultBlockRepo,
  followRepo = defaultFollowRepo,
  closeFriendRepo = defaultCloseFriendRepo,
) => {
  const getViewableStory = async (
    viewerId: string,
    storyId: string,
  ): Promise<StoryWithDetails> => {
    const story = await storyRepo.findStoryById(storyId);
    if (!story || story.expiresAt < new Date()) throw new NotFoundError("Story");

    const isOwner = story.userId === viewerId;
    if (!isOwner) {
      const isBlocked = await blockRepo.isBlockedEitherWay(viewerId, story.userId);
      if (isBlocked) throw new ForbiddenError("This story is not available");

      if (story.user.isPrivate) {
        const followRecord = await followRepo.findFollow(viewerId, story.userId);
        if (!followRecord || followRecord.status !== "ACCEPTED") {
          throw new ForbiddenError("This story is not available");
        }
      }

      if (story.isCloseFriends) {
        const isCloseFriend = await closeFriendRepo.isCloseFriends(viewerId, story.userId);
        if (!isCloseFriend) throw new ForbiddenError("This story is not available");
      }

      const isViewer = story.viewers.find((v) => v.user.id === viewerId);
      if (!isViewer) {
        await storyRepo.createStoryViewer(storyId, viewerId);
      }
    }

    return story;
  };

  return {
    getViewableStory,

    createStory: async ({
      userId,
      isCloseFriends,
      media,
    }: CreateStoryInput): Promise<StoryResponseDTO> => {
      if (media.length === 0) throw new BadRequestError("Story must contain at least one media item");

      const expiresAt = new Date(Date.now() + STORY.EXPIRY_HOURS * 60 * 60 * 1000);
      const story = await storyRepo.createStory({ userId, isCloseFriends, expiresAt }, media);

      logger.info(`[STORY SERVICE] Story created: ${story.id} by ${userId}`);
      return mapStoryResponse(story);
    },

    getStoryById: async (viewerId: string, storyId: string): Promise<StoryResponseDTO> => {
      const story = await getViewableStory(viewerId, storyId);
      return mapStoryResponse(story);
    },

    getStoryViewers: async (
      storyId: string,
      viewerId: string,
    ): Promise<StoryViewerResponseDTO[]> => {
      const story = await storyRepo.findStoryById(storyId);
      if (!story) throw new NotFoundError("Story");

      if (story.userId !== viewerId) {
        throw new ForbiddenError("You are not authorized to view the viewers of this story");
      }

      return storyRepo.findStoryViewer(storyId);
    },

    deleteStoryById: async (storyId: string, userId: string): Promise<void> => {
      const story = await storyRepo.findStoryById(storyId);
      if (!story) throw new NotFoundError("Story");

      if (story.userId !== userId) {
        throw new ForbiddenError("You are not authorized to delete this story");
      }

      await storyRepo.deleteStory(storyId);

      story.media.forEach((m) => {
        if (m.urlPublicId) {
          deleteFromCloudinary(m.urlPublicId, m.type.toLowerCase() as "image" | "video");
        }
      });

      logger.info(`[STORY SERVICE] Story deleted: ${storyId} by ${userId}`);
    },
  };
};

export type StoryService = ReturnType<typeof createStoryService>;
export const storyService = createStoryService();
