import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  DuplicateEntryError,
} from "@core/errors/index.js";
import { transporter } from "@core/utils/email.util.js";
import { logger } from "@core/utils/logger.js";
import {
  generateVerificationCode,
  generateResetPasswordToken,
  hashToken,
} from "@core/utils/otp.util.js";
import {
  BaseTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  generateRegisterToken,
  getRefreshTokenExpiry,
  RefreshTokenPayload,
  verifyToken,
  verifyTokenIgnoreExpiry,
} from "@core/utils/jwt.util.js";
import {
  ActiveSessionResponseDTO,
  AuthenticatedUserResponse,
  GoogleLoginResponseDTO,
  LoginResponseDTO,
  TokenResponseDTO,
} from "./dto/auth-response.dto.js";
import {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResendVerificationDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from "./dto/auth-request.dto.js";
import { env } from "@core/config/env.config.js";
import { SecurityContext } from "@core/utils/device.util.js";
import { authRepository as defaultAuthRepo } from "./auth.repository.js";
import { userRepository as defaultUserRepo } from "../user/user.repository.js";

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

interface OAuthRegisterPayload extends BaseTokenPayload {
  email: string;
  provider: string;
  providerAccountId: string;
  fullName: string;
  profilePic: string | null;
  type: string;
}

const generateJti = () => crypto.randomUUID();

export const createAuthService = (
  authRepo = defaultAuthRepo,
  userRepo = defaultUserRepo,
) => {
  const generateUserSession = async (
    userId: string,
    username: string,
    context?: SecurityContext,
  ): Promise<TokenResponseDTO> => {
    const jti = generateJti();
    const accessToken = generateAccessToken(userId, username);
    const refreshToken = generateRefreshToken(userId, jti);
    const expiresAt = getRefreshTokenExpiry();

    await authRepo.saveRefreshToken({
      jti,
      userId,
      expiresAt,
      browser: context?.browser,
      os: context?.os,
      ipAddress: context?.ipAddress,
    });

    return { accessToken, refreshToken };
  };

  return {
    generateUserSession,

    register: async (input: RegisterDTO): Promise<AuthenticatedUserResponse> => {
      const { username, email, password } = input;
      const [emailExists, usernameExists] = await Promise.all([
        userRepo.findUserByEmail(email),
        userRepo.findUserByUsername(username),
      ]);

      if (emailExists) throw new ConflictError("Email already taken", "email");
      if (usernameExists) throw new ConflictError("Username already taken", "username");

      const hashedPassword = await bcrypt.hash(password, 12);
      const { otp, hashedOtp, otpExpiry } = generateVerificationCode();

      try {
        const newUser = await userRepo.createUser({
          username,
          email,
          password: hashedPassword,
          isVerified: false,
          verificationToken: hashedOtp,
          verificationTokenExpiry: otpExpiry,
        });

        transporter
          .sendMail({
            from: env.FROM_EMAIL,
            to: email,
            subject: "Email Verification Code",
            text: `Your verification code is ${otp}. It is valid for 5 minutes.`,
          })
          .catch((error: Error) => {
            logger.error(
              `[AUTH SERVICE] Failed to send verification email to ${email}: ${error.message}`,
            );
          });

        const { password: _, verificationToken, verificationTokenExpiry, ...safeUserData } = newUser;
        logger.info(`[AUTH SERVICE] New user registered with email: ${email}`);
        return safeUserData;
      } catch (error) {
        if (error instanceof DuplicateEntryError) {
          throw new ConflictError(
            error.field === "email" ? "Email already taken" : "Username already taken",
            error.field,
          );
        }
        throw error;
      }
    },

    verifyEmail: async ({ email, otp }: VerifyEmailDTO): Promise<AuthenticatedUserResponse> => {
      const user = await userRepo.findUserByEmail(email);
      if (!user) throw new NotFoundError("User");
      if (user.isVerified) throw new BadRequestError("User is already verified");

      const hashedOtp = hashToken(otp);
      if (user.verificationToken !== hashedOtp) throw new BadRequestError("Invalid verification code");
      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        throw new BadRequestError("Verification code has expired");
      }

      logger.info(`[AUTH SERVICE] User verified with email: ${email}`);

      const updatedUser = await userRepo.updateUserByEmail(email, {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      const {
        password: _,
        verificationToken: __,
        verificationTokenExpiry: ___,
        ...safeUserData
      } = updatedUser;

      return safeUserData;
    },

    resendVerificationEmail: async ({ email }: ResendVerificationDTO): Promise<void> => {
      const user = await userRepo.findUserByEmail(email);
      if (!user) throw new NotFoundError("User");
      if (user.isVerified) throw new BadRequestError("User is already verified");

      if (user.verificationTokenExpiry && user.verificationTokenExpiry > new Date()) {
        const remainingMs = user.verificationTokenExpiry.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60_000);
        throw new BadRequestError(
          `Please wait ${remainingMin} minutes before resending a new verification code`,
        );
      }

      const { otp, hashedOtp, otpExpiry } = generateVerificationCode();

      try {
        await transporter.sendMail({
          from: env.FROM_EMAIL,
          to: email,
          subject: "Email Verification Code",
          text: `Your verification code is ${otp}. It is valid for 5 minutes.`,
        });

        await userRepo.updateUserByEmail(email, {
          verificationToken: hashedOtp,
          verificationTokenExpiry: otpExpiry,
        });

        logger.info(`[AUTH SERVICE] Resent verification email to: ${email}`);
      } catch (error) {
        const err = error as Error;
        logger.error(`[AUTH SERVICE] SMTP Email failure to ${email}: ${err.message}`);
        throw new InternalServerError("Failed to send verification email due to mail gateway issue");
      }
    },

    login: async (input: LoginDTO, context?: SecurityContext): Promise<LoginResponseDTO> => {
      const user = await userRepo.findUserByEmail(input.email);
      if (!user) throw new UnauthorizedError("Invalid email or password combination");

      if (!user.password) {
        throw new BadRequestError("This account uses Google login. Please sign in with Google.");
      }

      if (!user.isVerified) {
        throw new ForbiddenError("Email is not verified. Please check your email to verify your account.");
      }

      const isMatch = await bcrypt.compare(input.password, user.password);
      if (!isMatch) throw new UnauthorizedError("Invalid email or password combination");

      const { accessToken, refreshToken } = await generateUserSession(user.id, user.username, context);
      const { password: _, ...safeUserData } = user;

      logger.info(`[AUTH SERVICE] User logged in: ${user.id}`);
      return { user: safeUserData, accessToken, refreshToken };
    },

    refreshSession: async (oldRefreshToken: string, context?: SecurityContext): Promise<TokenResponseDTO> => {
      let decoded: RefreshTokenPayload;
      try {
        decoded = await verifyToken(oldRefreshToken, env.JWT_SECRET_REFRESH);
      } catch (error) {
        throw new UnauthorizedError("Invalid or expired refresh token. Please login again");
      }

      const userId = decoded.sub;
      const oldJti = decoded.jti;

      const tokenRecord = await authRepo.findRefreshToken(oldJti);
      if (!tokenRecord) {
        await authRepo.revokeAllSessionsForUser(userId);
        logger.warn(`[AUTH SERVICE] Token reuse detected for user ID: ${userId}. All sessions revoked.`);
        throw new UnauthorizedError("Security issue detected. Please login again");
      }

      const user = await userRepo.findUserById(userId);
      if (!user) {
        await authRepo.revokeAllSessionsForUser(userId);
        throw new UnauthorizedError("User no longer exists. Please login again");
      }

      const newJti = generateJti();
      const newAccessToken = generateAccessToken(userId, user.username);
      const newRefreshToken = generateRefreshToken(userId, newJti);
      const newExpiresAt = getRefreshTokenExpiry();

      await authRepo.rotateRefreshToken({
        oldJti,
        newJti,
        userId,
        expiresAt: newExpiresAt,
        browser: context?.browser || tokenRecord.browser,
        os: context?.os || tokenRecord.os,
        ipAddress: context?.ipAddress || tokenRecord.ipAddress,
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    },

    forgotPassword: async ({ email }: ForgotPasswordDTO): Promise<void> => {
      const user = await userRepo.findUserByEmail(email);
      if (!user) throw new NotFoundError("User");
      if (!user.isVerified) throw new BadRequestError("User is not verified. Please verify email first");
      if (!user.password) throw new BadRequestError("User registered with OAuth. Password reset is unavailable");

      const { token, hashedToken, resetTokenExpiry } = generateResetPasswordToken();
      const resetUrl = `${env.RESET_PASSWORD_URL}?token=${token}`;

      try {
        await transporter.sendMail({
          from: env.FROM_EMAIL,
          to: email,
          subject: "Password Reset Request",
          text: `You requested a password reset. Click this link to reset: ${resetUrl}\n\nIf you did not request this, ignore this email.`,
        });

        await userRepo.updateUserByEmail(email, {
          resetPasswordToken: hashedToken,
          resetPasswordTokenExpiry: resetTokenExpiry,
        });

        logger.info(`[AUTH SERVICE] Password reset requested for email: ${email}`);
      } catch (error) {
        const err = error as Error;
        logger.error(`[AUTH SERVICE] SMTP failure to ${email}: ${err.message}`);
        throw new InternalServerError("Failed to send password reset email due to mail gateway issue");
      }
    },

    resetPassword: async ({ token, newPassword }: ResetPasswordDTO): Promise<void> => {
      const hashedToken = hashToken(token);
      const user = await userRepo.findUserByToken(hashedToken);
      if (!user) throw new BadRequestError("Invalid or expired reset token");

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await userRepo.updateUserById(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      });

      logger.info(`[AUTH SERVICE] Password reset successful for email: ${user.email}`);
    },

    processGoogleLogin: async (
      profile: GoogleProfile,
      providerName: string,
    ): Promise<GoogleLoginResponseDTO> => {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) throw new BadRequestError(`Email access is required from ${providerName}`);

      const providerId = profile.id;
      const user = await userRepo.findUserByEmail(email);

      if (user) {
        const linkedAccount = await authRepo.findLinkedAccount(providerName, providerId);
        if (!linkedAccount) {
          await authRepo.createLinkedAccount(user.id, providerName, providerId);
          logger.info(`[AUTH SERVICE] Linked ${providerName} account for email: ${email}`);
        }

        const { password: _, verificationToken, verificationTokenExpiry, ...safeUserData } = user;
        return { isNewUser: false, user: safeUserData };
      }

      const registerPayload = {
        email,
        provider: providerName,
        providerAccountId: providerId,
        fullName: profile.displayName || "Unknown User",
        profilePic: profile.photos?.[0]?.value || null,
        type: "oauth_registration",
      };

      const registerToken = generateRegisterToken(registerPayload);
      logger.info(`[AUTH SERVICE] Initiated OAuth registration for email: ${email}`);

      return { isNewUser: true, registerToken };
    },

    completeOAuthRegistration: async (
      registerToken: string,
      username: string,
      context?: SecurityContext,
    ): Promise<LoginResponseDTO> => {
      const sanitizedUsername = username.trim();
      let decoded: OAuthRegisterPayload;

      try {
        decoded = await verifyToken<OAuthRegisterPayload>(registerToken);
        if (decoded.type !== "oauth_registration") throw new Error();
      } catch (error) {
        throw new BadRequestError("Session expired or invalid token.");
      }

      const existingUser = await userRepo.findUserByUsername(sanitizedUsername);
      if (existingUser) throw new ConflictError("Username is already taken", "username");

      const newUser = await authRepo.createUserWithAccount(
        {
          email: decoded.email,
          username: sanitizedUsername,
          fullName: decoded.fullName,
          profilePic: decoded.profilePic,
          isVerified: true,
        },
        {
          provider: decoded.provider,
          providerAccountId: decoded.providerAccountId,
        },
      );

      const { accessToken, refreshToken } = await generateUserSession(newUser.id, newUser.username, context);
      logger.info(`[AUTH SERVICE] Completed OAuth registration for: ${newUser.username}`);

      const { password: _, verificationToken, verificationTokenExpiry, ...safeUserData } = newUser;
      return { user: safeUserData, accessToken, refreshToken };
    },

    logout: async (refreshToken: string): Promise<void> => {
      try {
        const decoded = await verifyTokenIgnoreExpiry(refreshToken, env.JWT_SECRET_REFRESH);
        if (decoded && decoded.jti) {
          await authRepo.deleteRefreshToken(decoded.jti);
          logger.info("[AUTH SERVICE] Refresh token revoked successfully during logout.");
        }
      } catch (error) {
        logger.warn("[AUTH SERVICE] Logout warning: Token not found or already missing");
      }
    },

    getActiveSessions: async (
      userId: string,
      currentJti?: string,
    ): Promise<ActiveSessionResponseDTO[]> => {
      const sessions = await authRepo.findAllSessionsByUserId(userId);
      return sessions.map((session) => ({
        id: session.id,
        browser: session.browser || "Unknown Browser",
        os: session.os || "Unknown OS",
        ipAddress: session.ipAddress || "Unknown IP",
        currentSession: session.id === currentJti,
        createdAt: session.createdAt,
      }));
    },
  };
};

export type AuthService = ReturnType<typeof createAuthService>;
export const authService = createAuthService();
