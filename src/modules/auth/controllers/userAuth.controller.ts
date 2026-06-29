import { Request, Response } from "express";
import { z } from "zod";
import * as userAuthService from "../services/userAuth.service.js";
import { COOKIES_OPTIONS, TOKEN_EXPIRY } from "../../../config/cookie.js";
import {
  completeOAuthRegistrationSchema,
  emailVerificationSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "../validators/userAuth.validation.js";
import { extractSecurityContext } from "../../../common/utils/device.js";

// helper function to set auth cookie
const setAuthCookie = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie("accessToken", accessToken, {
    ...COOKIES_OPTIONS,
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS,
  });

  res.cookie("refreshToken", refreshToken, {
    ...COOKIES_OPTIONS,
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
  });
};

// Controller for user registration
export const registerController = async (
  req: Request<any, any, z.infer<typeof registerSchema>["body"]>,
  res: Response,
): Promise<void> => {
  const { username, email, password } = req.body;
  const user = await userAuthService.register({ username, email, password });

  res.status(201).json({
    success: true,
    message: "Registration successfully. Please check your email to verify your account.",
    data: user,
  });
};

// Controller for email verification
export const verifyEmailController = async (
  req: Request<any, any, z.infer<typeof emailVerificationSchema>["body"]>,
  res: Response,
): Promise<void> => {
  const { email, otp } = req.body;

  await userAuthService.verifyEmail({ email, otp });

  res.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
};

// Controller for resending verification email
export const resendVerificationEmailController = async (
  req: Request<any, any, z.infer<typeof resendVerificationSchema>["body"]>,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  await userAuthService.resendVerificationEmail({ email });

  res.status(200).json({
    success: true,
    message: "Verification email resent successfully. Please check your email",
  });
};

// Controller for user login
export const loginController = async (
  req: Request<any, any, z.infer<typeof loginSchema>["body"]>,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;
  const context = extractSecurityContext(req);

  const { user, accessToken, refreshToken } = await userAuthService.login(
    { email, password },
    context,
  );

  // Set cookie access token and refresh token
  setAuthCookie(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successfully.",
    data: user,
  });
};

// Controller for forgot password
export const forgotPasswordController = async (
  req: Request<any, any, z.infer<typeof forgotPasswordSchema>["body"]>,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  await userAuthService.forgotPassword({ email });

  res.status(200).json({
    success: true,
    message: "Password reset email sent successfully. Please check your email",
  });
};

// Controller for reset password
export const resetPasswordController = async (
  req: Request<any, any, z.infer<typeof resetPasswordSchema>["body"]>,
  res: Response,
): Promise<void> => {
  const { token, newPassword } = req.body;

  await userAuthService.resetPassword({ token, newPassword });

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password",
  });
};

// Controller for refresh session token
export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  const oldRefreshToken = req.cookies.refreshToken;
  const context = extractSecurityContext(req);
  if (!oldRefreshToken) {
    res.status(401).json({
      success: false,
      message: "Refresh token missing.",
    });
    return;
  }

  const { accessToken, refreshToken } = await userAuthService.refreshSession(
    oldRefreshToken,
    context,
  );

  // Set cookie access token and refresh token
  setAuthCookie(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Session refreshed.",
  });
};

// Controller for Google OAuth Callback
export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }

  const googleProfile = req.user as unknown as userAuthService.GoogleProfile;

  const authResult = await userAuthService.processGoogleLogin(googleProfile, "google");
  const context = extractSecurityContext(req);

  // If authentication failed, redirect to login page with error message
  if (!authResult) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }

  // If it's a new user, redirect to complete registration page with the registration token
  if (authResult.isNewUser) {
    return res.redirect(
      `${process.env.CLIENT_URL}/complete-registration?token=${authResult.registerToken}`,
    );
  }

  const { accessToken, refreshToken } = await userAuthService.generateUserSession(
    authResult.user.id,
    authResult.user.username,
    context,
  );

  // Set cookie access token and refresh token
  setAuthCookie(res, accessToken, refreshToken);

  res.redirect(`${process.env.CLIENT_URL}/`);
};

// Controller for completing OAuth registration
export const completeOAuthRegistrationController = async (
  req: Request<any, any, z.infer<typeof completeOAuthRegistrationSchema>["body"]>,
  res: Response,
): Promise<void> => {
  const { registerToken, username } = req.body;
  const context = extractSecurityContext(req);

  const { user, accessToken, refreshToken } = await userAuthService.completeOAuthRegistration(
    registerToken,
    username,
    context,
  );

  // Set cookie access token and refresh token
  setAuthCookie(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Registration completed successfully.",
    data: user,
  });
};

// Controller for user logout
export const logoutController = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await userAuthService.logout(refreshToken);
  }

  res.clearCookie("accessToken", COOKIES_OPTIONS);
  res.clearCookie("refreshToken", COOKIES_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Logout successfully.",
  });
};
