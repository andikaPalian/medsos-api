import { Response } from "express";
import { z } from "zod";
import * as userService from "../services/user.service.js";
import * as mediaService from "../../media/services/media.service.js";
import { getProfileParams, updateUserSchema } from "../validations/user.validation.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import { authHandler } from "../../../common/utils/authHandler.js";

export const updateProfile = authHandler(
  async (
    req: AuthenticatedRequest<any, any, z.infer<typeof updateUserSchema>["body"]>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { username, fullName, bio, isPrivate } = req.body;
    const uploadMedia = req.file ? await mediaService.uploadProfilePicture(req.file) : undefined;

    const updatedUser = await userService.updateProfile(
      userId,
      { username, fullName, bio, isPrivate },
      uploadMedia,
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  },
);

export const getProfile = authHandler(
  async (
    req: AuthenticatedRequest<z.infer<typeof getProfileParams>["params"], any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    const profile = await userService.getUserProfile(userId, targetUserId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  },
);
