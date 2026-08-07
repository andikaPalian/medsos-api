import { Express, Router } from "express";
import { API_PREFIX } from "@core/constants/app.constants.js";
import { authRouter } from "@modules/auth/auth.routes.js";
import { userRouter } from "@modules/user/user.routes.js";
import { postRouter } from "@modules/post/post.routes.js";
import { commentRouter } from "@modules/comment/comment.routes.js";
import { likeRouter } from "@modules/like/like.routes.js";
import { followRouter } from "@modules/follow/follow.routes.js";
import { storyRouter } from "@modules/story/story.routes.js";
import { messageRouter } from "@modules/message/message.routes.js";
import { notificationRouter } from "@modules/notification/notification.routes.js";
import { reportRouter } from "@modules/report/report.routes.js";
import { blockRouter } from "@modules/block/block.routes.js";
import { closeFriendRouter } from "@modules/close-friend/close-friend.routes.js";
import { searchRouter } from "@modules/search/search.routes.js";

export const registerRoutes = (app: Express): void => {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/users", userRouter);
  router.use("/posts", postRouter);
  router.use("/comments", commentRouter);
  router.use("/likes", likeRouter);
  router.use("/follows", followRouter);
  router.use("/stories", storyRouter);
  router.use("/messages", messageRouter);
  router.use("/notifications", notificationRouter);
  router.use("/reports", reportRouter);
  router.use("/blocks", blockRouter);
  router.use("/close-friends", closeFriendRouter);
  router.use("/search", searchRouter);

  app.use(API_PREFIX, router);
};
