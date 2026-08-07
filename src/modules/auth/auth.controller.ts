import { Request, Response } from "express";
import { authService as defaultAuthService } from "./auth.service.js";
import { setAuthCookies, clearAuthCookies } from "@infra/http/helpers/cookie.helper.js";
import { sendSuccess, sendCreated, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { extractSecurityContext } from "@core/utils/device.util.js";
import { env } from "@core/config/env.config.js";
import {
  CompleteOAuthRegistrationBody,
  EmailVerificationBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResendVerificationBody,
  ResetPasswordBody,
} from "./auth.validation.js";

export const createAuthController = (service = defaultAuthService) => ({
  register: async (req: Request<unknown, unknown, RegisterBody>, res: Response): Promise<void> => {
    const { username, email, password } = req.body;
    const user = await service.register({ username, email, password });
    sendCreated(res, user, "Registration successful. Please check your email to verify your account.");
  },

  verifyEmail: async (req: Request<unknown, unknown, EmailVerificationBody>, res: Response): Promise<void> => {
    const { email, otp } = req.body;
    await service.verifyEmail({ email, otp });
    sendEmptySuccess(res, "Email verified successfully.");
  },

  resendVerificationEmail: async (
    req: Request<unknown, unknown, ResendVerificationBody>,
    res: Response,
  ): Promise<void> => {
    const { email } = req.body;
    await service.resendVerificationEmail({ email });
    sendEmptySuccess(res, "Verification email resent successfully. Please check your email.");
  },

  login: async (req: Request<unknown, unknown, LoginBody>, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const context = extractSecurityContext(req as any);
    const { user, accessToken, refreshToken } = await service.login({ email, password }, context);

    setAuthCookies(res, accessToken, refreshToken);
    sendSuccess(res, user, "Login successful.");
  },

  forgotPassword: async (req: Request<unknown, unknown, ForgotPasswordBody>, res: Response): Promise<void> => {
    const { email } = req.body;
    await service.forgotPassword({ email });
    sendEmptySuccess(res, "Password reset email sent successfully. Please check your email.");
  },

  resetPassword: async (req: Request<unknown, unknown, ResetPasswordBody>, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;
    await service.resetPassword({ token, newPassword });
    sendEmptySuccess(res, "Password reset successfully. You can now log in with your new password.");
  },

  refreshToken: async (req: Request, res: Response): Promise<void> => {
    const oldRefreshToken = req.cookies.refreshToken;
    const context = extractSecurityContext(req as any);

    if (!oldRefreshToken) {
      res.status(401).json({ success: false, message: "Refresh token missing." });
      return;
    }

    const { accessToken, refreshToken } = await service.refreshSession(oldRefreshToken, context);
    setAuthCookies(res, accessToken, refreshToken);
    sendEmptySuccess(res, "Session refreshed.");
  },

  googleAuthCallback: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }

    const googleProfile = req.user as unknown as {
      id: string;
      displayName: string;
      emails?: Array<{ value: string }>;
      photos?: Array<{ value: string }>;
    };

    const authResult = await service.processGoogleLogin(googleProfile, "google");
    const context = extractSecurityContext(req as any);

    if (!authResult) {
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }

    if (authResult.isNewUser) {
      return res.redirect(
        `${env.CLIENT_URL}/complete-registration?token=${authResult.registerToken}`,
      );
    }

    const { accessToken, refreshToken } = await service.generateUserSession(
      authResult.user.id,
      authResult.user.username,
      context,
    );

    setAuthCookies(res, accessToken, refreshToken);
    res.redirect(`${env.CLIENT_URL}/`);
  },

  completeOAuthRegistration: async (
    req: Request<unknown, unknown, CompleteOAuthRegistrationBody>,
    res: Response,
  ): Promise<void> => {
    const { registerToken, username } = req.body;
    const context = extractSecurityContext(req as any);

    const { user, accessToken, refreshToken } = await service.completeOAuthRegistration(
      registerToken,
      username,
      context,
    );

    setAuthCookies(res, accessToken, refreshToken);
    sendSuccess(res, user, "Registration completed successfully.");
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await service.logout(refreshToken);
    }

    clearAuthCookies(res);
    sendEmptySuccess(res, "Logout successful.");
  },
});

export type AuthController = ReturnType<typeof createAuthController>;
export const authController = createAuthController();
