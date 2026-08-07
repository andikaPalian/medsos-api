import { Router } from "express";
import { closeFriendController } from "./close-friend.controller.js";
import * as closeFriendValidator from "./close-friend.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const closeFriendRouter = Router();

closeFriendRouter.use(userAuth);

closeFriendRouter.get("/", closeFriendController.getCloseFriends);

closeFriendRouter.post(
  "/:friendId",
  validate(closeFriendValidator.closeFriendActionSchema),
  closeFriendController.addCloseFriend,
);

closeFriendRouter.delete(
  "/:friendId",
  validate(closeFriendValidator.closeFriendActionSchema),
  closeFriendController.removeCloseFriend,
);
