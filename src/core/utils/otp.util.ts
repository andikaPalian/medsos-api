// ============================================================
// OTP and reset token generation utilities
// ============================================================

import crypto from "crypto";
import { AUTH } from "@core/constants/app.constants.js";

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateVerificationCode = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashToken(otp);
  const otpExpiry = new Date(Date.now() + AUTH.OTP_EXPIRY_MINS * 60 * 1000);

  return { otp, hashedOtp, otpExpiry };
};

export const generateResetPasswordToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  const resetTokenExpiry = new Date(Date.now() + AUTH.RESET_TOKEN_EXPIRY_MINS * 60 * 1000);

  return { token, hashedToken, resetTokenExpiry };
};
