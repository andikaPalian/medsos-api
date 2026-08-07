import { Request, Response } from "express";
import { followService as defaultFollowService } from "./follow.service.js";
import { sendCreated, sendSuccess, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import {
  FollowActionParams,
  ListFollowRelationsParams,
  ListFollowRelationsQuery,
  ListFollowRequestParams,
  ListFollowRequestQuery,
} from "./follow.validation.js";

export const createFollowController = (service = defaultFollowService) => ({
  getFollowRelations: async (
    req: Request<ListFollowRelationsParams, unknown, unknown, ListFollowRelationsQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;
    const { direction, cursor, limit } = req.query;

    const result = await service.listFollowRelations(direction || "FOLLOWERS", {
      requesterId: userId,
      targetUserId,
      cursor: cursor ?? null,
      limit: limit ? Number(limit) : 10,
    });

    sendSuccess(res, result, "Follow relations retrieved successfully");
  },

  getFollowRequests: async (
    req: Request<ListFollowRequestParams, unknown, unknown, ListFollowRequestQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;
    const { cursor, limit } = req.query;

    const result = await service.listFollowRequests({
      requesterId: userId,
      targetUserId,
      cursor: cursor ?? null,
      limit: limit ? Number(limit) : 10,
    });

    sendSuccess(res, result, "Follow requests retrieved successfully");
  },

  followUser: async (
    req: Request<FollowActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    await service.followUser(userId, targetUserId);
    sendCreated(res, null, "Follow request sent successfully");
  },

  confirmFollowRequest: async (
    req: Request<FollowActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    await service.confirmFollowRequest(userId, targetUserId);
    sendEmptySuccess(res, "Follow request accepted successfully");
  },

  rejectFollowRequest: async (
    req: Request<FollowActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    await service.rejectFollowRequest(userId, targetUserId);
    sendEmptySuccess(res, "Follow request rejected successfully");
  },

  unfollowUser: async (
    req: Request<FollowActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    await service.unfollowUser(userId, targetUserId);
    sendEmptySuccess(res, "Unfollowed successfully");
  },
});

export type FollowController = ReturnType<typeof createFollowController>;
export const followController = createFollowController();
