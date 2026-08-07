import { Router } from "express";
import { followController } from "./follow.controller.js";
import * as followValidator from "./follow.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const followRouter = Router();

followRouter.use(userAuth);

followRouter.get(
  "/users/:targetUserId",
  validate(followValidator.listFollowRelationsSchema),
  followController.getFollowRelations as any,
);

followRouter.get(
  "/requests/:targetUserId",
  validate(followValidator.followActionSchema),
  followController.getFollowRequests as any,
);

followRouter.post(
  "/users/:targetUserId/follow",
  validate(followValidator.followActionSchema),
  followController.followUser,
);

followRouter.post(
  "/users/:targetUserId/confirm",
  validate(followValidator.followActionSchema),
  followController.confirmFollowRequest,
);

followRouter.post(
  "/users/:targetUserId/reject",
  validate(followValidator.followActionSchema),
  followController.rejectFollowRequest,
);

followRouter.delete(
  "/users/:targetUserId/unfollow",
  validate(followValidator.followActionSchema),
  followController.unfollowUser,
);
