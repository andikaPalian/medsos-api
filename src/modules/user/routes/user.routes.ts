import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import * as userValidator from "../validations/user.validation.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { UPLOAD_CONFIG, uploadImage } from "../../../middlewares/multer.js";
import { validateFileContent } from "../../../middlewares/validateFileContent.js";
import { validate } from "../../../middlewares/validator.js";

export const userRouter = Router();

userRouter.use(userAuth);

userRouter.patch(
  "/",
  uploadImage.single("profilePic"),
  validateFileContent(UPLOAD_CONFIG.IMAGE.MIME_TYPES),
  validate(userValidator.updateUserSchema),
  userController.updateProfile,
);
userRouter.get(
  "/:targetUserId",
  validate(userValidator.getProfileParams),
  userController.getProfile,
);
