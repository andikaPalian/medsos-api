import express from "express";
import { userAuth } from "../../../middlewares/userMiddleware.js";
import { commentOnPostController, createPostController, deleteCommentController, deletePostController, getCommentsByPostController, getFeedController, getPostByIdController, getSavedPostsController, likesToggleController, replyCommentController, reportPostController, savePostToggleController, updatePostController } from "./post.controller.js";
import { upload } from "../../../middlewares/multer.js";

export const postRouter = express.Router();

// Feed and Saved Posts
postRouter.get("/feed", userAuth, getFeedController);
postRouter.get("/saved", userAuth, getSavedPostsController);

// Post CRUD
postRouter.post("/", userAuth, upload.array("media"), createPostController);
postRouter.get("/:postId", userAuth, getPostByIdController);
postRouter.patch("/:postId/update", userAuth, upload.array("media"), updatePostController);
postRouter.delete("/:postId/delete", userAuth, deletePostController);

// Like, save, report
postRouter.post("/:postId/like", userAuth, likesToggleController);
postRouter.post("/:postId/save", userAuth, savePostToggleController);
postRouter.post("/:postId/report", userAuth, reportPostController);

// Comments and Replies
postRouter.post("/:postId/comment", userAuth, commentOnPostController);
postRouter.get("/:postId/comments", userAuth, getCommentsByPostController);
postRouter.post("/:postId/comment/:commentId/reply", userAuth, replyCommentController);
postRouter.delete("/:postId/comment/:commentId/delete", userAuth, deleteCommentController);