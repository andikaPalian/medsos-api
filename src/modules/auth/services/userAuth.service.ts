import * as authRepository from "../repositories/auth.repository.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import { AppError } from "../../../common/error/errorHandler.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { transporter } from "../../../common/utils/email.js";
import { logger } from "../../../common/utils/logger.js";
import {
  generateVerificationCode,
  generateResetPasswordToken,
  hashToken,
} from "../../../common/utils/generateOtp.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateRegisterToken,
  getRefreshTokenExpiry,
  TokenPayload,
  verifyToken,
  verifyTokenIgnoreExpiry,
} from "../../../common/utils/jwt.js";
import {
  AuthenticatedUserResponse,
  GoogleLoginResponseDTO,
  LoginResponseDTO,
  TokenResponseDTO,
} from "../dto/auth-response.dto.js";
import {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResendVerificationDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from "../dto/auth-request.dto.js";
import { env } from "../../../config/env.js";

interface SecurityContext {
  deviceInfo?: string | null;
  ipAddress?: string | null;
}

interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

interface OAuthRegisterPayload extends TokenPayload {
  email: string;
  provider: string;
  providerAccountId: string;
  fullName: string;
  profilePic: string | null;
  type: string;
}

const generateJti = () => crypto.randomUUID();

export const generateUserSession = async (
  userId: string,
  username: string,
  context?: SecurityContext,
): Promise<TokenResponseDTO> => {
  const jti = generateJti();

  const accessToken = generateAccessToken(userId, username);
  const refreshToken = generateRefreshToken(userId, jti);
  const expiresAt = getRefreshTokenExpiry();

  await authRepository.saveRefreshToken({
    jti,
    userId,
    expiresAt,
    deviceInfo: context?.deviceInfo,
    ipAddress: context?.ipAddress,
  });

  return { accessToken, refreshToken };
};

// Service function for user registration with email and password
export const register = async (input: RegisterDTO): Promise<AuthenticatedUserResponse> => {
  const { username, email, password } = input;
  // Check if user with the same email already exists
  const emailExists = await userRepository.findUserByEmail(email);
  if (emailExists) {
    throw new AppError("Email already exists and taken", 400);
  }

  // Check if user with the same username already exists
  const usernameExists = await userRepository.findUserByUsername(username);
  if (usernameExists) {
    throw new AppError("Username already exists and taken", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Otp
  const { otp, hashedOtp, otpExpiry } = generateVerificationCode();

  // Create/Register new user
  const newUser = await userRepository.createUser({
    username,
    email,
    password: hashedPassword,
    isVerified: false,
    verificationToken: hashedOtp,
    verificationTokenExpiry: otpExpiry,
  });

  // Send verification email
  transporter
    .sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Email Verification Code",
      text: `Your verification code is ${otp}. It is valid for 5 minutes.`,
    })
    .catch((error) => {
      logger.error(
        `[AUTH SERVICE] Failed to send verification email to ${email}: ${error.message}`,
      );
    });

  const { password: _, verificationToken, verificationTokenExpiry, ...safeUserData } = newUser;

  logger.info(`[AUTH SERVICE] New user registered with email: ${email}`);

  return safeUserData;
};

// Service function for email verification
export const verifyEmail = async ({
  email,
  otp,
}: VerifyEmailDTO): Promise<AuthenticatedUserResponse> => {
  // Check if user exists
  const user = await userRepository.findUserByEmail(email);
  if (!user) throw new AppError("User not found", 404);
  // Check if user is already verified
  if (user.isVerified) throw new AppError("User is already verified", 400);

  // Check if OTP is valid
  const hashedOtp = hashToken(otp);
  if (user.verificationToken !== hashedOtp) throw new AppError("Invalid verification code", 400);
  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    throw new AppError("Verification code has expired", 400);
  }

  logger.info(`[AUTH SERVICE] User verified with email: ${email}`);

  // Update user as verified
  return await userRepository.updateUserByEmail(email, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });
};

// Service function to resend verification email
export const resendVerificationEmail = async ({ email }: ResendVerificationDTO): Promise<void> => {
  // Check if user exists
  const user = await userRepository.findUserByEmail(email);
  if (!user) throw new AppError("User not found", 404);
  // Check if user is alreadty verified
  if (user.isVerified === true) throw new AppError("User is already verified", 400);

  // Check if existing token is still valid
  if (user.verificationTokenExpiry && user.verificationTokenExpiry > new Date()) {
    throw new AppError(
      "Verification token is still valid. Please wait 5 minutes before requesting a new one",
      400,
    );
  }

  // Generate new OTP
  const { otp, hashedOtp, otpExpiry } = generateVerificationCode();

  try {
    // Send verification email
    transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Email Verification Code",
      text: `Your verification code is ${otp}. It is valid for 5 minutes.`,
    });

    // Update new OTP and expiry for the user
    await userRepository.updateUserByEmail(email, {
      verificationToken: hashedOtp,
      verificationTokenExpiry: otpExpiry,
    });

    logger.info(`[AUTH SERVICE] Resent verification emai to: ${email}`);
  } catch (error: any) {
    logger.error(`[AUTH SERVICE] SMTP Email failure to ${email}: ${error.message}`);
    throw new AppError(
      "Failed to send verification email due to server email gateway issue, please try again",
      500,
    );
  }
};

// Service function for user login with email and password
export const login = async (
  input: LoginDTO,
  context?: SecurityContext,
): Promise<LoginResponseDTO> => {
  // Check if user exists
  const user = await userRepository.findUserByEmail(input.email);
  if (!user) {
    throw new AppError("Invalid email or password combination", 401);
  }

  // Check if user registered with OAuth or email/password
  if (!user.password) {
    throw new AppError("User registered with OAuth. Please login with google", 400);
  }

  // Check if user is verified
  if (user.isVerified === false) {
    throw new AppError("User is not verified. Please verify your email first", 401);
  }

  // Validate password
  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password combination", 401);
  }

  // Generate access token and refresh token
  const { accessToken, refreshToken } = await generateUserSession(user.id, user.username, context);

  const { password: _, ...safeUserData } = user;

  logger.info(`[AUTH SERVICE] User logged in with email": ${input.email}`);

  return { user: safeUserData, accessToken, refreshToken };
};

// Service for refresh user session
export const refreshSession = async (
  oldRefreshToken: string,
  context?: SecurityContext,
): Promise<TokenResponseDTO> => {
  let decoded: TokenPayload;
  try {
    decoded = await verifyToken(oldRefreshToken, env.JWT_SECRET_REFRESH);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token. Please login again", 401);
  }

  // Extract user ID and old refresh token
  const userId = decoded.sub;
  const oldJti = decoded.jti;

  const tokenRecord = await authRepository.findRefreshToken(oldJti);
  if (!tokenRecord) {
    await authRepository.revokeAllSessionForUser(userId);
    logger.warn(
      `[AUTH SERVICE] Token reuse detected for user ID: ${userId}. Refresh token revoked.`,
    );
    throw new AppError("Security issue. Please login again", 401);
  }

  // Generate new access token and refresh token
  const newJti = generateJti();
  const newAccessToken = generateAccessToken(userId, decoded.username || "");
  const newRefreshToken = generateRefreshToken(userId, newJti);
  const newExpiresAt = getRefreshTokenExpiry();

  await authRepository.rotateRefreshToken({
    oldJti,
    newJti,
    userId,
    expiresAt: newExpiresAt,
    deviceInfo: context?.deviceInfo || tokenRecord.deviceInfo,
    ipAddress: context?.ipAddress || tokenRecord.ipAddress,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// Service function for forgot password
export const forgotPassword = async ({ email }: ForgotPasswordDTO): Promise<void> => {
  // Check if user exists
  const user = await userRepository.findUserByEmail(email);
  if (!user) throw new AppError("User not found", 404);
  // check if user is verified
  if (user.isVerified === false) {
    throw new AppError("User is not verified. Please verify your email first", 400);
  }

  // Check if user registered with OAuth or email/password
  if (!user.password) {
    throw new AppError("User registered with OAuth. Password reset is not available", 400);
  }

  // Generate reset password token and expiry
  const { token, hashedToken, resetTokenExpiry } = generateResetPasswordToken();

  // Send password reset email
  const resetUrl = `${process.env.RESET_PASSWORD_URL}?token=${token}`;
  try {
    // Send email with reset link
    transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `You are receiving this email because you requested a password reset. Please click the following link or paste it into your browser to reset your password: ${resetUrl}\n\n
                  If you did not request a password reset, please ignore this email.`,
    });

    // Add reset token and expiry to user record
    await userRepository.updateUserByEmail(email, {
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: resetTokenExpiry,
    });

    logger.info(`[AUTH SERVICE] Password reset requested for email: ${email}`);
  } catch (error: any) {
    logger.error(`[AUTH SERVICE] SMTP failure to ${email}: ${error.message}`);
    throw new AppError(
      "Failed to send password reset email due to server email gateway issue, please try again",
      500,
    );
  }
};

// Service function for reset password
export const resetPassword = async ({ token, newPassword }: ResetPasswordDTO): Promise<void> => {
  // Hash token from the request
  const hashedToken = hashToken(token);

  // Check if user with the token exists and token is not expired
  const user = await userRepository.findUserByToken(hashedToken);
  if (!user) throw new AppError("Invalid or expired token", 400);

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update user's password and remove reset token and expiry
  await userRepository.updateUserById(user.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
  });

  logger.info(`[AUTH SERVICE] Password reset successful for email: ${user.email}`);
};

// OAuth login
// Check if user exists or must fill the username first
export const processGoogleLogin = async (
  profile: GoogleProfile,
  providerName: string,
): Promise<GoogleLoginResponseDTO> => {
  // Extract email from profile
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) {
    throw new AppError(`Email acess is required from ${providerName} for authentication`, 400);
  }

  // Extract provider account id from profile
  const providerId = profile.id;

  // Check if user with the email already exists
  const user = await userRepository.findUserByEmail(email);
  if (user) {
    // If user exists but not linked with the provider. Link the account
    const linkedAccount = await authRepository.findLinkedAccount(providerName, providerId);
    if (!linkedAccount) {
      await authRepository.createLinkedAccount(user.id, providerName, providerId);
      logger.info(`[AUTH SERVICE] Linked ${providerName} account for user with email: ${email}`);
    }

    const { password: _, verificationToken, verificationTokenExpiry, ...safeUserData } = user;
    return { isNewUser: false, user: safeUserData };
  }

  // If user does not exist, create a register token and ask user to fill the username to complete registration
  const registerPayload = {
    email,
    provider: providerName,
    providerAccountId: providerId,
    fullName: profile.displayName || "Unknown User",
    profilePic: profile.photos?.[0]?.value || null,
    type: "oauth_registration",
  };

  const registerToken = generateRegisterToken(registerPayload);

  logger.info(
    `[AUTH SERVICE] Initiated Oath registration for email: ${email} using provider: ${providerName}`,
  );

  return {
    isNewUser: true,
    registerToken,
  };
};

// Service function to complete OAuth registration after user fills the username
export const completeOAuthRegistration = async (
  registerToken: string,
  username: string,
  context?: SecurityContext,
): Promise<LoginResponseDTO> => {
  const sanitizedUsername = username.trim();

  let decoded: OAuthRegisterPayload;
  try {
    decoded = (await verifyToken(registerToken)) as OAuthRegisterPayload;
    if (decoded.type !== "oauth_registration") throw new Error();
  } catch (error) {
    throw new AppError("Session expired or invalid.", 400);
  }

  const existingUser = await userRepository.findUserByUsername(sanitizedUsername);
  if (existingUser) {
    throw new AppError("Username already exists and taken. Please choose another one", 400);
  }

  const newUser = await authRepository.createUserWithAccount(
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

  const { accessToken, refreshToken } = await generateUserSession(
    newUser.id,
    newUser.username,
    context,
  );

  logger.info(`[AUTH SERVICE] Completed OAuth registration for: ${newUser.username}`);

  const { password: _, verificationToken, verificationTokenExpiry, ...safeUserData } = newUser;
  return { user: safeUserData, accessToken, refreshToken };
};

// Service function to logout and remove the refresh token
export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const decoded = await verifyTokenIgnoreExpiry(refreshToken, env.JWT_SECRET_REFRESH);

    if (decoded && decoded.jti) {
      await authRepository.deleteRefreshToken(decoded.jti);
      logger.info(`[AUTH SERVICE] Refresh token revoked successfully during logout.`);
    }
  } catch (error) {
    logger.warn(`[AUTH SERVICE] Logout warning: Token code not found or already missing in DB`);
  }
};
