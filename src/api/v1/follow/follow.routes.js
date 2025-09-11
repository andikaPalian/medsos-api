import express from "express";
import { userAuth } from "../../../middlewares/userMiddleware.js";
import { acceptRequestController, getMutualFollowersController, listRequestsController, rejectRequestController, toggleFollowController } from "./follow.controller.js";

export const followRouter = express.Router();

// Follow & Unfollow
followRouter.post("/:targetUserId/toggle", userAuth, toggleFollowController);

// Requests
followRouter.get("/requests", userAuth, listRequestsController);
followRouter.post("/:followerId/accept", userAuth, acceptRequestController);
followRouter.post("/:followerId/reject", userAuth, rejectRequestController);

// Mutual Followers
followRouter.get("/:targetUserId/mutual-followers", userAuth, getMutualFollowersController);