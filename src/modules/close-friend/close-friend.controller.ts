import { Request, Response } from "express";
import { closeFriendService as defaultCloseFriendService } from "./close-friend.service.js";
import { sendCreated, sendSuccess, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { CloseFriendActionParams } from "./close-friend.validation.js";

export const createCloseFriendController = (service = defaultCloseFriendService) => ({
  addCloseFriend: async (
    req: Request<CloseFriendActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { friendId } = req.params;

    await service.addCloseFriend(userId, friendId);
    sendCreated(res, null, "Added to close friends successfully");
  },

  removeCloseFriend: async (
    req: Request<CloseFriendActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { friendId } = req.params;

    await service.removeCloseFriend(userId, friendId);
    sendEmptySuccess(res, "Removed from close friends successfully");
  },

  getCloseFriends: async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const list = await service.getCloseFriends(userId);
    sendSuccess(res, list, "Close friends retrieved successfully");
  },
});

export type CloseFriendController = ReturnType<typeof createCloseFriendController>;
export const closeFriendController = createCloseFriendController();
