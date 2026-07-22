import { Router } from "express";
import * as postController from "../controllers/post.controller.js";
import * as postValidator from "../validations/post.validator.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { UPLOAD_CONFIG, uploadMedia } from "../../../middlewares/multer.js";
import { validatePostMediaSize } from "../../../middlewares/validatePostMediaSize.js";
import { validateFileContent } from "../../../middlewares/validateFileContent.js";
import { validate } from "../../../middlewares/validator.js";

export const postRouter = Router();

postRouter.use(userAuth);

const allowedPostMimeTypes = new Set([
  ...UPLOAD_CONFIG.IMAGE.MIME_TYPES,
  ...UPLOAD_CONFIG.VIDEO.MIME_TYPES,
]);

postRouter.post(
  "/",
  uploadMedia.array("postMedia", 10),
  validatePostMediaSize,
  validateFileContent(allowedPostMimeTypes),
  validate(postValidator.createPostSchema),
  postController.createPost,
);
postRouter.patch(
  "/:postId",
  uploadMedia.array("postMedia", 10),
  validatePostMediaSize,
  validateFileContent(allowedPostMimeTypes),
  validate(postValidator.updatePostSchema),
  postController.updatePost,
);
postRouter.delete("/:postId", validate(postValidator.deletePostSchema), postController.deletePost);
postRouter.get("/:postId", validate(postValidator.getPostByIdSchema), postController.getPostById);
postRouter.get("/", validate(postValidator.getFeedSchema), postController.getFeed);
