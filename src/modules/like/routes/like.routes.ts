import { Router } from "express";
import * as likeController from "../controllers/like.controller.js";
import * as likeValidator from "../validations/like.validator.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";

export const likeRouter = Router();

likeRouter.use(userAuth);

likeRouter.post("/:postId/like", validate(likeValidator.likeActionSchema), likeController.likePost);
likeRouter.delete(
  "/:postId/like",
  validate(likeValidator.likeActionSchema),
  likeController.unlikePost,
);
