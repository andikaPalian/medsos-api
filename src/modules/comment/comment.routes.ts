import { Router } from "express";
import { commentController } from "./comment.controller.js";
import * as commentValidator from "./comment.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const commentRouter = Router();

commentRouter.use(userAuth);

commentRouter.post(
  "/posts/:postId",
  validate(commentValidator.commentOnPostSchema),
  commentController.commentOnPost,
);

commentRouter.post(
  "/posts/:postId/comments/:commentId",
  validate(commentValidator.replyToCommentSchema),
  commentController.replyToComment,
);

commentRouter.get(
  "/posts/:postId",
  validate(commentValidator.getCommentsByPostSchema),
  commentController.getCommentsByPost as any,
);

commentRouter.delete(
  "/:commentId",
  validate(commentValidator.deleteCommentSchema),
  commentController.deleteComment,
);
