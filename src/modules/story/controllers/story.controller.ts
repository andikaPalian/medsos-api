import { Response } from "express";
import * as storyService from "../services/story.service.js";
import * as mediaService from "../../media/services/media.service.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import { CreateMediaInput } from "../dto/story-request.dto.js";
import { CreateStoryBody, StoryParams } from "../validations/story.validator.js";

const deriveMediaType = (mimeType: string): "IMAGE" | "VIDEO" => {
  return mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";
};

const uploadStoryFile = async (
  files: Express.Multer.File[] | undefined,
): Promise<CreateMediaInput[]> => {
  if (!files || files.length === 0) return [];

  return await Promise.all(
    files.map(async (f) => {
      const uploaded = await mediaService.uploadPostMedia(f);
      return {
        url: uploaded.url,
        urlPublicId: uploaded.publicId,
        type: deriveMediaType(f.mimetype),
      };
    }),
  );
};

export const createStory = authHandler(
  async (
    req: AuthenticatedRequest<any, any, CreateStoryBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { isCloseFriends } = req.body;
    const files = req.files as Express.Multer.File[];
    const media = await uploadStoryFile(files);

    const story = await storyService.createStory({ userId, isCloseFriends, media });

    res.status(201).json({
      success: true,
      data: story,
    });
  },
);

export const getStoryById = authHandler(
  async (
    req: AuthenticatedRequest<StoryParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const viewerId = req.user.id;
    const { storyId } = req.params;

    const story = await storyService.getStoryById(viewerId, storyId);

    res.status(200).json({
      success: true,
      data: story,
    });
  },
);

export const getStoryViewers = authHandler(
  async (
    req: AuthenticatedRequest<StoryParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const viewerId = req.user.id;
    const { storyId } = req.params;

    const viewers = await storyService.getStoryViewers(storyId, viewerId);

    res.status(200).json({
      success: true,
      data: viewers,
    });
  },
);

export const deleteStory = authHandler(
  async (
    req: AuthenticatedRequest<StoryParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { storyId } = req.params;

    await storyService.deleteStoryById(storyId, userId);

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
      data: { storyId },
    });
  },
);
