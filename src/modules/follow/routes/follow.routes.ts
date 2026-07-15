import { Router } from "express";
import * as followController from "../controllers/follow.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";
import {
  followActionSchema,
  listFollowRelationsSchema,
  listFollowRequestSchema,
} from "../validation/follow.validation.js";

export const followRouter = Router();

followRouter.use(userAuth);

followRouter.get(
  "/:targetUserId",
  validate(listFollowRelationsSchema),
  followController.getFollowRelations,
);
followRouter.get(
  "/:targetUserId/requests",
  validate(listFollowRequestSchema),
  followController.getFollowRequests,
);
followRouter.post("/:targetUserId", validate(followActionSchema), followController.followUser);
followRouter.patch(
  "/:targetUserId/confirm",
  validate(followActionSchema),
  followController.confirmFollowRequest,
);
followRouter.patch(
  "/:targetUserId/reject",
  validate(followActionSchema),
  followController.rejectFollowRequest,
);
