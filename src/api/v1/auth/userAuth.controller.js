import * as userAuthService from "./userAuth.service.js";
import catchAsync from "../../../utils/catchAsync.js";
import { COOKIES_OPTIONS } from "../../../config/cookie.js";

// Controller for user registration
export const registerController = catchAsync(async (req, res, next) => {
  const user = await userAuthService.register(req.body);

  return res.status(201).json({
    success: true,
    message: "Registration successfully. Please check your email to verify your account.",
    data: user,
  });
});

// Controller for email verification
export const verifyEmailController = catchAsync(async (req, res, next) => {
  await userAuthService.verifyEmail(req.body);

  return res.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
});

// Controller for resending verification email
export const resendVerificationEmailController = catchAsync(async (req, res, next) => {
  await userAuthService.resendVerificationEmail(req.body);

  return res.status(200).json({
    success: true,
    message: "Verification email resent successfully. Please check your email",
  });
});

// Controller for user login
export const loginController = catchAsync(async (req, res, next) => {
  const { user, accessToken, refreshToken } = await userAuthService.login(req.body);

  // Set cookie access token
  res.cookie("accessToken", accessToken, {
    ...COOKIES_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  // Set cookie refresh token
  res.cookie("refreshToken", refreshToken, {
    ...COOKIES_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Login successfully.",
    data: user,
  });
});

// Controller for forgot password
export const forgotPasswordController = catchAsync(async (req, res, next) => {
  await userAuthService.forgotPassword(req.body);

  return res.status(200).json({
    success: true,
    message: "Password reset email sent successfully. Please check your email",
  });
});

// Controller for reset password
export const resetPasswordController = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;

  await userAuthService.resetPassword({ token, newPassword });

  return res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password",
  });
});

// Controller for refresh session token
export const refreshTokenController = catchAsync(async (req, res, next) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing.",
    });
  }

  const { accessToken, refreshToken } = await userAuthService.refreshSession(oldRefreshToken);

  res.cookie("accessToken", accessToken, {
    ...COOKIES_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...COOKIES_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Session refreshed.",
  });
});

// Controller for Google OAuth Callback
export const googleAuthCallback = catchAsync(async (req, res, next) => {
  const authResult = req.user;

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
  );

  // Set cookie access token and refresh token
  res.cookie("accessToken", accessToken, {
    ...COOKIES_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...COOKIES_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
});

// Controller for completing OAuth registration
export const completeOAuthRegistrationController = catchAsync(async (req, res, next) => {
  const { registerToken, username } = req.body;

  const { user, accessToken, refreshToken } = await userAuthService.completeOAuthRegistration(
    registerToken,
    username,
  );

  res.cookie("accessToken", accessToken, {
    ...COOKIES_OPTIONS,
    maxAge: 15 * 69 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...COOKIES_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Registration completed successfully.",
    data: user,
  });
});

// Controller for user logout
export const logoutController = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await userAuthService.logout(refreshToken);
  }

  res.clearCookie("accessToken", COOKIES_OPTIONS);
  res.clearCookie("refreshToken", COOKIES_OPTIONS);

  return res.status(200).json({
    success: true,
    message: "Logout successfully.",
  });
});
