import { Router } from "express";
import * as storyController from "../controllers/story.controller.js";
import * as storyValidator from "../validations/story.validator.js";
import { UPLOAD_CONFIG, uploadMedia } from "../../../middlewares/multer.js";
import { validatePostMediaSize } from "../../../middlewares/validatePostMediaSize.js";
import { validateFileContent } from "../../../middlewares/validateFileContent.js";
import { validate } from "../../../middlewares/validator.js";

export const storyRouter = Router();

const allowedPostMimeTypes = new Set([
  ...UPLOAD_CONFIG.IMAGE.MIME_TYPES,
  ...UPLOAD_CONFIG.VIDEO.MIME_TYPES,
]);

storyRouter.post(
  "/",
  uploadMedia.array("storyMedia", 4),
  validatePostMediaSize,
  validateFileContent(allowedPostMimeTypes),
  validate(storyValidator.createStorySchema),
  storyController.createStory,
);
storyRouter.get(
  "/:storyId",
  validate(storyValidator.storyActionSchema),
  storyController.getStoryById,
);
storyRouter.get(
  "/:storyId/viewers",
  validate(storyValidator.storyActionSchema),
  storyController.getStoryViewers,
);
storyRouter.delete(
  "/:storyId",
  validate(storyValidator.storyActionSchema),
  storyController.deleteStory,
);
