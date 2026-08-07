import { Router } from "express";
import { likeController } from "./like.controller.js";
import * as likeValidator from "./like.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const likeRouter = Router();

likeRouter.use(userAuth);

likeRouter.post(
  "/:postId/like",
  validate(likeValidator.likeActionSchema),
  likeController.likePost,
);

likeRouter.delete(
  "/:postId/like",
  validate(likeValidator.likeActionSchema),
  likeController.unlikePost,
);
