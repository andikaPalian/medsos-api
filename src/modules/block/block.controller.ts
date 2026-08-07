import { Request, Response } from "express";
import { blockService as defaultBlockService } from "./block.service.js";
import { sendCreated, sendSuccess, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { BlockActionParams } from "./block.validation.js";

export const createBlockController = (service = defaultBlockService) => ({
  blockUser: async (
    req: Request<BlockActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    await service.blockUser(userId, targetUserId);
    sendCreated(res, null, "User blocked successfully");
  },

  unblockUser: async (
    req: Request<BlockActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    await service.unblockUser(userId, targetUserId);
    sendEmptySuccess(res, "User unblocked successfully");
  },

  getBlockedUsers: async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const list = await service.getBlockedUsers(userId);
    sendSuccess(res, list, "Blocked users retrieved successfully");
  },
});

export type BlockController = ReturnType<typeof createBlockController>;
export const blockController = createBlockController();
