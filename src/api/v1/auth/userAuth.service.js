import * as authRepository from "./auth.repository.js";
import { AppError } from "../../../utils/errorHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { transporter } from "../../../utils/email.js";
import logger from "../../../utils/logger.js";
import {
  generateVerificationCode,
  generateResetPasswordToken,
  hashToken,
} from "../../../utils/generateOtp.js";

// Service function for user registration with email and password
export const register = async (userData) => {
  const { username, email, password } = userData;
  // Check if user with the same email already exists
  const emailExists = await authRepository.findUserByEmail(email);
  if (emailExists) {
    throw new AppError("Email already exists and taken", 400);
  }

  // Check if user with the same username already exists
  const usernameExists = await authRepository.findUserByUsername(username);
  if (usernameExists) {
    throw new AppError("Username already exists and taken", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Otp
  const { otp, hashedOtp, otpExpiry } = generateVerificationCode();

  // Create/Register new user
  const newUser = await authRepository.createUser({
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
export const verifyEmail = async ({ email, otp }) => {
  // Check if user exists
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw new AppError("User not found", 404);
  // Check if user is already verified
  if (user.isVerified) throw new AppError("User is already verified", 400);

  // Check if OTP is valid
  const hashedOtp = hashToken(otp);
  if (user.verificationToken !== hashedOtp) throw new AppError("Invalid verification code", 400);
  if (user.verificationTokenExpiry < new Date()) {
    throw new AppError("Verification code has expired", 400);
  }

  logger.info(`[AUTH SERVICE] User verified with email: ${email}`);

  // Update user as verified
  return await authRepository.updateUserByEmail(email, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });
};

// Service function to resend verification email
export const resendVerificationEmail = async ({ email }) => {
  // Check if user exists
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw new AppError("User not found", 404);
  // Check if user is alreadty verified
  if (user.isVerified === true) throw new AppError("User is already verified", 400);

  // Check if existing token is still valid
  if (user.verificationTokenExpiry > new Date()) {
    throw new AppError(
      "Verification token is still valid. Please wait 5 minutes before requesting a new one",
      400,
    );
  }

  // Generate new OTP
  const { otp, hashedOtp, otpExpiry } = generateVerificationCode();

  // Update new OTP and expiry for the user
  await authRepository.updateUserByEmail(email, {
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
        `[AUTH SERVICE] Failed to resend verification email to ${email}: ${error.message}`,
      );
    });

  logger.info(`[AUTH SERVICE] Resent verification emai to: ${email}`);
};

// Service function for user login with email and password
export const login = async ({ email, password }) => {
  // Check if user exists
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new AppError("User not found or not registered. Please register first", 404);
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
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  // Generate JWT Token
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  const { password: _, ...safeUserData } = user;

  logger.info(`[AUTH SERVICE] User logged in with email": ${email}`);

  return { user: safeUserData, token };
};

// Service function for forgot password
export const forgotPassword = async ({ email }) => {
  // Check if user exists
  const user = await authRepository.findUserByEmail(email);
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
  const { resetToken, hashedToken, resetTokenExpiry } = generateResetPasswordToken();

  // Add reset token and expiry to user record
  await authRepository.updateUserByEmail(email, {
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpiry: resetTokenExpiry,
  });

  // Send password reset email
  const resetUrl = `${process.env.RESET_PASSWORD_URL}?token=${resetToken}`;

  // Send email with reset link
  transporter
    .sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `You are receiving this email because you requested a password reset. Please click the following link or paste it into your browser to reset your password: ${resetUrl}\n\n
                If you did not request a password reset, please ignore this email.`,
    })
    .catch((error) => {
      logger.error(
        `[AUTH SERVICE] Failed to send password reset email to ${email}: ${error.message}`,
      );
    });

  logger.info(`[AUTH SERVICE] Password reset requested for email: ${email}`);
};

// Service function for reset password
export const resetPassword = async ({ token, newPassword }) => {
  // Hash token from the request
  const hashedToken = hashToken(token);

  // Check if user with the token exists and token is not expired
  const user = await authRepository.findUserByToken(hashedToken);
  if (!user) throw new AppError("Invalid or expired token", 400);

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update user's password and remove reset token and expiry
  await authRepository.updateUserById(user.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
  });

  logger.info(`[AUTH SERVICE] Password reset successful for email: ${user.email}`);
};

// OAuth login
// Check if user exists or must fill the username first
export const processGoogleLogin = async (profile, providerName) => {
  // Extract email from profile
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) {
    throw new AppError(`Email acess is required from ${providerName} for authentication`, 400);
  }

  // Extract provider account id from profile
  const providerId = profile.id;

  // Check if user with the email already exists
  const user = await authRepository.findUserByEmail(email);
  if (user) {
    // If user exists but not linked with the provider. Link the account
    const linkedAccount = await authRepository.findLinkedAccount(providerName, providerId);
    if (!linkedAccount) {
      await authRepository.linkedAccount(user.id, providerName, providerId);
      logger.info(`[AUTH SERVICE] Linked ${providerName} account for user with email: ${email}`);
    }

    const { password: _, ...safeUserData } = user;
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

  const registerToken = jwt.sign(registerPayload, process.env.JWT_SECRET, { expiresIn: "15m" });

  logger.info(
    `[AUTH SERVICE] Initiated Oath registration for email: ${email} using provider: ${providerName}`,
  );

  return {
    isNewUser: true,
    registerToken,
  };
};

// Service function to complete OAuth registration after user fills the username
export const completeOAuthRegistration = async (registerToken, username) => {
  const sanitizedUsername = username.trim();

  let decoded;
  try {
    decoded = jwt.verify(registerToken, process.env.JWT_SECRET);
    if (decoded.type !== "oauth_registration") throw new Error();
  } catch (error) {
    throw new AppError("Session expired or invalid.", 400);
  }

  const existingUser = await authRepository.findUserByUsername(sanitizedUsername);
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

  logger.info(`[AUTH SERVICE] Completed OAuth registration for: ${newUser.username}`);

  const { password: _, ...safeUserData } = newUser;
  return safeUserData;
};
