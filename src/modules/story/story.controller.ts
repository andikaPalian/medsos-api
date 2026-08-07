import { Request, Response } from "express";
import { storyService as defaultStoryService } from "./story.service.js";
import { uploadToCloudinary } from "@core/utils/cloudinary.util.js";
import { sendCreated, sendSuccess, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { CreateMediaInput } from "./dto/story-request.dto.js";
import { CreateStoryBody, StoryParams } from "./story.validation.js";

const deriveMediaType = (mimeType: string): "IMAGE" | "VIDEO" => {
  return mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";
};

const uploadStoryFiles = async (
  files: Express.Multer.File[] | undefined,
): Promise<CreateMediaInput[]> => {
  if (!files || files.length === 0) return [];

  return Promise.all(
    files.map(async (f) => {
      const uploaded = await uploadToCloudinary(f);
      return {
        url: uploaded.url,
        urlPublicId: uploaded.publicId,
        type: deriveMediaType(f.mimetype),
      };
    }),
  );
};

export const createStoryController = (service = defaultStoryService) => ({
  createStory: async (
    req: Request<unknown, unknown, CreateStoryBody>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { isCloseFriends } = req.body;
    const files = req.files as Express.Multer.File[];
    const media = await uploadStoryFiles(files);

    const story = await service.createStory({ userId, isCloseFriends, media });
    sendCreated(res, story, "Story created successfully");
  },

  getStoryById: async (
    req: Request<StoryParams>,
    res: Response,
  ): Promise<void> => {
    const viewerId = req.user!.id;
    const { storyId } = req.params;

    const story = await service.getStoryById(viewerId, storyId);
    sendSuccess(res, story, "Story retrieved successfully");
  },

  getStoryViewers: async (
    req: Request<StoryParams>,
    res: Response,
  ): Promise<void> => {
    const viewerId = req.user!.id;
    const { storyId } = req.params;

    const viewers = await service.getStoryViewers(storyId, viewerId);
    sendSuccess(res, viewers, "Story viewers retrieved successfully");
  },

  deleteStory: async (
    req: Request<StoryParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { storyId } = req.params;

    await service.deleteStoryById(storyId, userId);
    sendEmptySuccess(res, "Story deleted successfully");
  },
});

export type StoryController = ReturnType<typeof createStoryController>;
export const storyController = createStoryController();
