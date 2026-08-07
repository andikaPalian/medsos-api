import { Request, Response } from "express";
import { likeService as defaultLikeService } from "./like.service.js";
import { sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { LikeActionParams } from "./like.validation.js";

export const createLikeController = (service = defaultLikeService) => ({
  likePost: async (
    req: Request<LikeActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const username = req.user!.username;
    const { postId } = req.params;

    await service.likePost({ userId, username, postId });
    sendEmptySuccess(res, "Post liked successfully");
  },

  unlikePost: async (
    req: Request<LikeActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { postId } = req.params;

    await service.unlikePost(userId, postId);
    sendEmptySuccess(res, "Post unliked successfully");
  },
});

export type LikeController = ReturnType<typeof createLikeController>;
export const likeController = createLikeController();
