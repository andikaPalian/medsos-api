import { Router } from "express";
import { postController } from "./post.controller.js";
import * as postValidator from "./post.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";
import { uploadMedia } from "@infra/http/middlewares/upload.middleware.js";

export const postRouter = Router();

postRouter.use(userAuth);

postRouter.get("/feed", validate(postValidator.getFeedSchema), postController.getFeed as any);

postRouter.get("/saved", validate(postValidator.getSavedPostsSchema), postController.getSavedPosts as any);

postRouter.post(
  "/",
  uploadMedia.array("mediaFiles", 10),
  validate(postValidator.createPostSchema),
  postController.createPost,
);

postRouter.get("/:postId", validate(postValidator.getPostByIdSchema), postController.getPostById);

postRouter.patch(
  "/:postId",
  uploadMedia.array("mediaFiles", 10),
  validate(postValidator.updatePostSchema),
  postController.updatePost,
);

postRouter.delete("/:postId", validate(postValidator.deletePostSchema), postController.deletePost);

postRouter.post("/:postId/save", validate(postValidator.savePostSchema), postController.savePost);

postRouter.delete("/:postId/save", validate(postValidator.unsavedPostSchema), postController.unsavePost);
