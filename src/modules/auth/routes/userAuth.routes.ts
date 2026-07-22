import { Router } from "express";
import * as userAuthController from "../controllers/userAuth.controller.js";
import * as userAuthValidator from "../validators/userAuth.validation.js";
import passport from "../../../config/passport.js";
import { authLimiter, emailLimiter } from "../../../middlewares/rateLimiter.js";
import { validate } from "../../../middlewares/validator.js";

export const userAuthRouter = Router();

// Registration local route
userAuthRouter.post(
  "/register",
  authLimiter,
  validate(userAuthValidator.registerSchema),
  userAuthController.registerController,
);
userAuthRouter.post(
  "/verify-email",
  validate(userAuthValidator.emailVerificationSchema),
  userAuthController.verifyEmailController,
);
userAuthRouter.post(
  "/resend-verification",
  emailLimiter,
  validate(userAuthValidator.resendVerificationSchema),
  userAuthController.resendVerificationEmailController,
);

// Login and Logout
userAuthRouter.post(
  "/login",
  authLimiter,
  validate(userAuthValidator.loginSchema),
  userAuthController.loginController,
);
userAuthRouter.post(
  "/logout",
  validate(userAuthValidator.logoutSchema),
  userAuthController.logoutController,
);

// Refresh Token
userAuthRouter.post(
  "/refresh-token",
  validate(userAuthValidator.refreshTokenSchema),
  userAuthController.refreshTokenController,
);

// Password Management
userAuthRouter.post(
  "/forgot-password",
  emailLimiter,
  validate(userAuthValidator.forgotPasswordSchema),
  userAuthController.forgotPasswordController,
);
userAuthRouter.post(
  "/reset-password",
  authLimiter,
  validate(userAuthValidator.resetPasswordSchema),
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
  validate(userAuthValidator.completeOAuthRegistrationSchema),
  userAuthController.completeOAuthRegistrationController,
);
