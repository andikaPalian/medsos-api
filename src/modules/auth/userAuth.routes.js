import express from "express";
import * as userAuthController from "./userAuth.controller.js";
import { authLimiter, emailLimiter } from "../../../middlewares/rateLimiter.js";
import passport from "../../../config/passport.js";

export const userAuthRouter = express.Router();

// Registration local route
userAuthRouter.post("/register", authLimiter, userAuthController.registerController);
userAuthRouter.post("/verify-email", userAuthController.verifyEmailController);
userAuthRouter.post(
  "/resend-verification",
  emailLimiter,
  userAuthController.resendVerificationEmailController,
);

// Login and Logout
userAuthRouter.post("/login", authLimiter, userAuthController.loginController);
userAuthRouter.post("/logout", userAuthController.logoutController);

// Refresh Token
userAuthRouter.post("/refresh-token", userAuthController.refreshTokenController);

// Password Management
userAuthRouter.post("/forgot-password", emailLimiter, userAuthController.forgotPasswordController);
userAuthRouter.post("/reset-password", authLimiter, userAuthController.resetPasswordController);

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
  userAuthController.completeOAuthRegistrationController,
);
