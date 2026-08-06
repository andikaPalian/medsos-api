import * as userRepository from "../../user/repositories/user.repository.js";
import * as storyRepository from "../repositories/story.repository.js";
import * as blockRepository from "../../block/repositories/block.repository.js";
import * as followRepository from "../../follow/repositories/follow.repository.js";
import * as closeFriendRepository from "../../closeFriend/repositories/closeFriend.repository.js";
import * as mediaService from "../../media/services/media.service.js";
import { CreateStoryInput } from "../dto/story-request.dto.js";
import { StoryResponseDTO, StoryViewerResponseDTO } from "../dto/story-response.dto.js";
import { logger } from "../../../common/utils/logger.js";
import { AppError } from "../../../common/error/errorHandler.js";

const mapStoryResponse = (story: storyRepository.StoryWithDetails): StoryResponseDTO => ({
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

const getViewableStory = async (
  viewerId: string,
  storyId: string,
): Promise<storyRepository.StoryWithDetails> => {
  const story = await storyRepository.findStoryById(storyId);
  if (!story) throw new AppError("Story not found", 404);

  if (story.expiresAt < new Date()) throw new AppError("Story not found", 404);

  const isOwner = story.userId === viewerId;
  if (!isOwner) {
    const isBlocked = await blockRepository.isBlockedEitherWay(viewerId, story.userId);
    if (isBlocked) throw new AppError("This story is not available", 403);

    if (story.user.isPrivate) {
      const followRecord = await followRepository.findFollow(viewerId, story.userId);
      if (!followRecord || followRecord.status !== "ACCEPTED") {
        throw new AppError("This story is not available", 403);
      }
    }

    if (story.isCloseFriends) {
      const isCloseFriend = await closeFriendRepository.isCLoseFriends(viewerId, story.userId);
      if (!isCloseFriend) throw new AppError("This story is not available", 403);
    }

    const isViewer = story.viewers.find((v) => v.user.id === viewerId);
    if (!isViewer) {
      await storyRepository.createStoryViewer(storyId, viewerId);
    }
  }

  return story;
};

export const createStory = async ({
  userId,
  isCloseFriends,
  media,
}: CreateStoryInput): Promise<StoryResponseDTO> => {
  if (media.length === 0) throw new AppError("Story must contains at least one media", 400);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const story = await storyRepository.createStory({ userId, isCloseFriends, expiresAt }, media);

  logger.info(`[STORY SERVICE] Story created: ${story.id} by ${userId}`);

  return mapStoryResponse(story);
};

export const getStoryById = async (
  viewerId: string,
  storyId: string,
): Promise<StoryResponseDTO> => {
  const story = await getViewableStory(viewerId, storyId);

  return mapStoryResponse(story);
};

export const getStoryViewers = async (
  storyId: string,
  viewerId: string,
): Promise<StoryViewerResponseDTO[]> => {
  const story = await storyRepository.findStoryById(storyId);
  if (!story) throw new AppError("Story not found", 404);

  if (story.userId !== viewerId) {
    throw new AppError("You are not authorized to view the viewers of this story", 403);
  }

  const viewers = await storyRepository.findStoryViewer(storyId);

  return viewers;
};

export const deleteStoryById = async (storyId: string, userId: string): Promise<void> => {
  const story = await storyRepository.findStoryById(storyId);
  if (!story) throw new AppError("Story not found", 404);

  if (story.userId !== userId) {
    throw new AppError("You are not authorized to delete this story", 403);
  }

  await storyRepository.deleteStory(storyId);

  story.media.forEach((m) => {
    if (m.urlPublicId) {
      mediaService.deleteAssets(m.urlPublicId, m.type.toLowerCase() as "image" | "video");
    }
  });

  logger.info(`[STORY SERVICE] Story deleted: ${storyId} by ${userId}`);
};
