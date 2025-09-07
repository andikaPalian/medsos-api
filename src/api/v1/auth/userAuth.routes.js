import express from "express";
import { forgotPasswordController, loginController, registerController, resendVerificationEmailController, resetPasswordController, verifyEmailController } from "./userAuth.controller.js";
import { validateBody } from "../../../middlewares/zodValidator.js";
import { loginSchema, registerSchema } from "../../../validators/userAuthValidation.js";

export const userAuthRouter = express.Router();

userAuthRouter.post("/register", validateBody(registerSchema), registerController);
userAuthRouter.post("/verify-email", verifyEmailController);
userAuthRouter.post("/resend-verification", resendVerificationEmailController);
userAuthRouter.post("/login", validateBody(loginSchema), loginController);
userAuthRouter.post("/forgot-password", forgotPasswordController);
userAuthRouter.post("/reset-password", resetPasswordController);