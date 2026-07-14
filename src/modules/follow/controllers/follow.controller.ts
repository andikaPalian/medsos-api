import { Response } from "express";
import * as followService from "../services/follow.service.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import {
  FollowParams,
  ListFollowRelationsParams,
  ListFollowRelationsQuery,
  ListFollowRequestParams,
  ListFollowRequestQuery,
} from "../validation/follow.validation.js";

export const getFollowRelations = authHandler(
  async (
    req: AuthenticatedRequest<ListFollowRelationsParams, any, any, ListFollowRelationsQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    const { direction, cursor, limit } = req.query;

    const result = await followService.listFollowRelations(direction, {
      requesterId: userId,
      targetUserId,
      cursor,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const getFollowRequests = authHandler(
  async (
    req: AuthenticatedRequest<ListFollowRequestParams, any, any, ListFollowRequestQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    const { cursor, limit } = req.query;

    const result = await followService.listFollowRequests({
      requesterId: userId,
      targetUserId,
      cursor,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const followUser = authHandler(
  async (req: AuthenticatedRequest<FollowParams, any, any, any>, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    await followService.followUser(userId, targetUserId);

    res.status(201).json({
      success: true,
      message: "Follow request sent successfully",
    });
  },
);

export const confirmFollowRequest = authHandler(
  async (req: AuthenticatedRequest<FollowParams, any, any, any>, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    await followService.confirmFollowRequest(userId, targetUserId);

    res.status(200).json({
      success: true,
      message: "Follow request accepted successfully",
    });
  },
);

export const rejectFollowRequest = authHandler(
  async (req: AuthenticatedRequest<FollowParams, any, any, any>, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    await followService.rejectFollowRequest(userId, targetUserId);

    res.status(200).json({
      success: true,
      message: "Follow request rejected successfully",
    });
  },
);
