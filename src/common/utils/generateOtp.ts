import crypto from "crypto";

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const generateVerificationCode = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
  return {
    otp,
    hashedOtp,
    otpExpiry,
  };
};

export const generateResetPasswordToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // Reset token valid for 5 minutes
  return {
    token,
    hashedToken,
    resetTokenExpiry,
  };
};
