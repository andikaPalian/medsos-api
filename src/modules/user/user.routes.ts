import { Router } from "express";
import { userController } from "./user.controller.js";
import * as userValidator from "./user.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { uploadImage } from "@infra/http/middlewares/upload.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const userRouter = Router();

userRouter.use(userAuth);

userRouter.patch(
  "/",
  uploadImage.single("profilePic"),
  validate(userValidator.updateUserSchema),
  userController.updateProfile,
);

userRouter.get(
  "/:targetUserId",
  validate(userValidator.getProfileParams),
  userController.getProfile,
);
