import { Router } from "express";
import { storyController } from "./story.controller.js";
import * as storyValidator from "./story.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { uploadMedia } from "@infra/http/middlewares/upload.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const storyRouter = Router();

storyRouter.use(userAuth);

storyRouter.post(
  "/",
  uploadMedia.array("storyMedia", 4),
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
