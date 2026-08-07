import { Router } from "express";
import { authController } from "./auth.controller.js";
import * as authValidator from "./auth.validation.js";
import passport from "@core/config/passport.config.js";
import { authLimiter, emailLimiter } from "@infra/http/middlewares/rate-limit.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";
import { env } from "@core/config/env.config.js";

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: johndoe }
 *               email: { type: string, example: john@example.com }
 *               password: { type: string, example: Password123! }
 *     responses:
 *       201: { description: Registration successful, verification OTP sent }
 *       400: { description: Validation error or Duplicate username/email }
 */
authRouter.post(
  "/register",
  authLimiter,
  validate(authValidator.registerSchema),
  authController.register,
);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address using OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: john@example.com }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Email verified successfully }
 */
authRouter.post(
  "/verify-email",
  validate(authValidator.emailVerificationSchema),
  authController.verifyEmail,
);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: john@example.com }
 *     responses:
 *       200: { description: OTP resent successfully }
 */
authRouter.post(
  "/resend-verification",
  emailLimiter,
  validate(authValidator.resendVerificationSchema),
  authController.resendVerificationEmail,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login with email & password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: john@example.com }
 *               password: { type: string, example: Password123! }
 *     responses:
 *       200: { description: Login successful, sets HTTP-only cookies }
 *       401: { description: Invalid credentials or unverified email }
 */
authRouter.post(
  "/login",
  authLimiter,
  validate(authValidator.loginSchema),
  authController.login,
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user and clear auth cookies
 *     responses:
 *       200: { description: Logout successful }
 */
authRouter.post(
  "/logout",
  validate(authValidator.logoutSchema),
  authController.logout,
);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token session using refresh token cookie
 *     responses:
 *       200: { description: Tokens refreshed }
 *       401: { description: Invalid or expired refresh token }
 */
authRouter.post(
  "/refresh-token",
  validate(authValidator.refreshTokenSchema),
  authController.refreshToken,
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: john@example.com }
 *     responses:
 *       200: { description: Password reset link sent }
 */
authRouter.post(
  "/forgot-password",
  emailLimiter,
  validate(authValidator.forgotPasswordSchema),
  authController.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, example: NewPassword123! }
 *     responses:
 *       200: { description: Password reset successful }
 */
authRouter.post(
  "/reset-password",
  authLimiter,
  validate(authValidator.resetPasswordSchema),
  authController.resetPassword,
);

// Google OAuth
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
    session: false,
  }),
  authController.googleAuthCallback,
);

authRouter.post(
  "/complete-oauth",
  authLimiter,
  validate(authValidator.completeOAuthRegistrationSchema),
  authController.completeOAuthRegistration,
);
