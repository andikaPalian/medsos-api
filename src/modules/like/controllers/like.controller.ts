import { Response } from "express";
import * as likeService from "../services/like.service.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import { LikeActionParams } from "../validations/like.validator.js";

export const likePost = authHandler(
  async (
    req: AuthenticatedRequest<LikeActionParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;

    await likeService.likePost(userId, postId);

    res.status(200).json({
      success: true,
      message: "Post liked successfully",
    });
  },
);

export const unlikePost = authHandler(
  async (
    req: AuthenticatedRequest<LikeActionParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;

    await likeService.unlikePost(userId, postId);

    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
    });
  },
);
