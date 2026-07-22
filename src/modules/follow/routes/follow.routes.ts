import { Router } from "express";
import * as followController from "../controllers/follow.controller.js";
import * as followValidator from "../validation/follow.validation.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";

export const followRouter = Router();

followRouter.use(userAuth);

followRouter.get(
  "/:targetUserId",
  validate(followValidator.listFollowRelationsSchema),
  followController.getFollowRelations,
);
followRouter.get(
  "/:targetUserId/requests",
  validate(followValidator.listFollowRequestSchema),
  followController.getFollowRequests,
);
followRouter.post(
  "/:targetUserId",
  validate(followValidator.followActionSchema),
  followController.followUser,
);
followRouter.patch(
  "/:targetUserId/confirm",
  validate(followValidator.followActionSchema),
  followController.confirmFollowRequest,
);
followRouter.patch(
  "/:targetUserId/reject",
  validate(followValidator.followActionSchema),
  followController.rejectFollowRequest,
);
