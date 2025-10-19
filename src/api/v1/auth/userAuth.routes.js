import express from "express";
import { forgotPasswordController, loginController, registerController, resendVerificationEmailController, resetPasswordController, verifyEmailController } from "./userAuth.controller.js";
import { validateBody } from "../../../middlewares/zodValidator.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resendVerificationEmailSchema, resetPasswordSchema, verifyEmailSchema } from "../../../validators/userAuthValidation.js";

export const userAuthRouter = express.Router();

userAuthRouter.post("/register", validateBody(registerSchema), registerController);
userAuthRouter.post("/verify-email", validateBody(verifyEmailSchema), verifyEmailController);
userAuthRouter.post("/resend-verification", validateBody(resendVerificationEmailSchema), resendVerificationEmailController);
userAuthRouter.post("/login", validateBody(loginSchema), loginController);
userAuthRouter.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
userAuthRouter.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);