import { Router } from "express";
import * as userAuthController from "../controllers/userAuth.controller.js";
import passport from "../../../config/passport.js";
import { authLimiter, emailLimiter } from "../../../middlewares/rateLimiter.js";
import { validate } from "../../../middlewares/validator.js";
import {
  completeOAuthRegistrationSchema,
  emailVerificationSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "../validators/userAuth.validation.js";

export const userAuthRouter = Router();

// Registration local route
userAuthRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  userAuthController.registerController,
);
userAuthRouter.post(
  "/verify-email",
  validate(emailVerificationSchema),
  userAuthController.verifyEmailController,
);
userAuthRouter.post(
  "/resend-verification",
  emailLimiter,
  validate(resendVerificationSchema),
  userAuthController.resendVerificationEmailController,
);

// Login and Logout
userAuthRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  userAuthController.loginController,
);
userAuthRouter.post("/logout", validate(logoutSchema), userAuthController.logoutController);

// Refresh Token
userAuthRouter.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  userAuthController.refreshTokenController,
);

// Password Management
userAuthRouter.post(
  "/forgot-password",
  emailLimiter,
  validate(forgotPasswordSchema),
  userAuthController.forgotPasswordController,
);
userAuthRouter.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  userAuthController.resetPasswordController,
);

// OAuth
userAuthRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);
userAuthRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
    session: false,
  }),
  userAuthController.googleAuthCallback,
);
userAuthRouter.post(
  "/complete-oauth",
  authLimiter,
  validate(completeOAuthRegistrationSchema),
  userAuthController.completeOAuthRegistrationController,
);
