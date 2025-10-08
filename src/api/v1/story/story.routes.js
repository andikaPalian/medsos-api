import express from "express";
import { userAuth } from "../../../middlewares/userMiddleware.js";
import { upload } from "../../../middlewares/multer.js";
import { createStoryController, deleteStoryController, getMyStoriesController, getStoryFeedController, getStoryViewersController, getUserStoriesController } from "./story.controller.js";

export const storyRouter = express.Router();

storyRouter.post("/create", userAuth, upload.single("media"), createStoryController);
storyRouter.get("/user/:userId", userAuth, getUserStoriesController);
storyRouter.get("/:storyId/viewers", userAuth, getStoryViewersController);
storyRouter.delete("/:storyId/delete", userAuth, deleteStoryController);
storyRouter.get("/myStories", userAuth, getMyStoriesController);
storyRouter.get("/story/feed", userAuth, getStoryFeedController);