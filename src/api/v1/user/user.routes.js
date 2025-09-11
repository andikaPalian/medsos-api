import express from "express";
import { userAuth } from "../../../middlewares/userMiddleware.js";
import { getUserProfileController, listCloseFriendsController, listFollowersController, listFollowingController, removeFollowerController, togglePrivateAccountController, updateCloseFriendsController, updateProfileController } from "./user.controller.js";
import { upload } from "../../../middlewares/multer.js";

export const userRouter = express.Router();

// PROFILE
userRouter.get("/:targetUserId", userAuth, getUserProfileController);
userRouter.patch("/me", userAuth, upload.single("profilePic"), updateProfileController);
userRouter.patch("/me/toggle-private", userAuth, togglePrivateAccountController);

// Followers & Following
userRouter.get("/:targetUserId/followers", userAuth, listFollowersController);
userRouter.get("/:targetUserId/following", userAuth, listFollowingController);

// CLose friends
userRouter.post("/:targetUserId/close-friends", userAuth, updateCloseFriendsController);
userRouter.get("/me/close-friends", userAuth, listCloseFriendsController);

// Remove follower
userRouter.delete("/users/:followerId/remove", userAuth, removeFollowerController);