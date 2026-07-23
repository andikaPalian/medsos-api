import { Router } from "express";
import * as commentController from "../controllers/comment.controller.js";
import * as commentValidator from "../validations/comment.validator.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";

export const commentRouter = Router();

commentRouter.use(userAuth);

commentRouter.post(
  "/:postId",
  validate(commentValidator.commentOnPostSchema),
  commentController.commentOnPost,
);
commentRouter.post(
  "/:postId/:commentId/reply",
  validate(commentValidator.replyToCommentSchema),
  commentController.replyToComment,
);
commentRouter.get(
  "/:postId",
  validate(commentValidator.getCommentsByPostSchema),
  commentController.getCommentsByPost,
);
commentRouter.delete(
  "/:commentId",
  validate(commentValidator.deleteCommentSchema),
  commentController.deleteComment,
);
