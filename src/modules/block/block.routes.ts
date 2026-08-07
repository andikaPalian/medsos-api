import { Router } from "express";
import { blockController } from "./block.controller.js";
import * as blockValidator from "./block.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const blockRouter = Router();

blockRouter.use(userAuth);

blockRouter.get("/", blockController.getBlockedUsers);

blockRouter.post(
  "/:targetUserId",
  validate(blockValidator.blockActionSchema),
  blockController.blockUser,
);

blockRouter.delete(
  "/:targetUserId",
  validate(blockValidator.blockActionSchema),
  blockController.unblockUser,
);
