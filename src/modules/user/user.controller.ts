import { Request, Response } from "express";
import { userService as defaultUserService } from "./user.service.js";
import { uploadToCloudinary } from "@core/utils/cloudinary.util.js";
import { sendSuccess } from "@infra/http/helpers/response.helper.js";
import { GetProfileParams, UpdateUserBody } from "./user.validation.js";
import { CLOUDINARY_FOLDERS } from "@core/constants/app.constants.js";

export const createUserController = (service = defaultUserService) => ({
  updateProfile: async (
    req: Request<unknown, unknown, UpdateUserBody>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { username, fullName, bio, isPrivate } = req.body;

    let uploadMedia;
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file, CLOUDINARY_FOLDERS.IMAGE);
      uploadMedia = { url: uploaded.url, publicId: uploaded.publicId };
    }

    const updatedUser = await service.updateProfile(
      userId,
      { username, fullName, bio, isPrivate },
      uploadMedia,
    );

    sendSuccess(res, updatedUser, "Profile updated successfully");
  },

  getProfile: async (
    req: Request<GetProfileParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    const profile = await service.getUserProfile(userId, targetUserId);
    sendSuccess(res, profile, "Profile retrieved successfully");
  },
});

export type UserController = ReturnType<typeof createUserController>;
export const userController = createUserController();
