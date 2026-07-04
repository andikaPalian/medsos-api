import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { UPLOAD_CONFIG, uploadImage } from "../../../middlewares/multer.js";
import { validateFileContent } from "../../../middlewares/validateFileContent.js";
import { validate } from "../../../middlewares/validator.js";
import { updateMessageSchema } from "../../message/validators/message.validation.js";
import { getProfileParams } from "../validations/user.validation.js";

export const userRouter = Router();

userRouter.use(userAuth);

userRouter.patch(
  "/",
  uploadImage.single("profilePic"),
  validateFileContent(UPLOAD_CONFIG.IMAGE.MIME_TYPES),
  validate(updateMessageSchema),
  userController.updateProfile,
);
userRouter.get("/:targetUserId", validate(getProfileParams), userController.getProfile);
