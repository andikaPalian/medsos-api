import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const registerSchema = z.object({
  body: z
    .object({
      username: z
        .string()
        .trim()
        .min(1, "Username is required")
        .max(50, "Username too long")
        .regex(usernameRegex, "Username can only contain letters, numbers, and underscores"),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Email format is not valid")
        .min(1, "Email is required"),
      password: z
        .string()
        .trim()
        .min(1, "Password is required")
        .regex(
          passwordRegex,
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        ),
      confirmPassword: z.string().trim().min(1, "Confirm Password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords does not match",
      path: ["confirmPassword"],
    }),
});

export const emailVerificationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Email format is not valid")
      .min(1, "Email is required"),
    otp: z.string().trim().min(1, "OTP is required"),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Email format is not valid")
      .min(1, "Email is required"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Email format is not valid")
      .min(1, "Email is required"),
    password: z.string().trim().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Email format is not valid")
      .min(1, "Email is required"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().trim().min(1, "Reset Token is required"),
      newPassword: z
        .string()
        .trim()
        .min(1, "New Password is required")
        .regex(passwordRegex, "Password format is not valid"),
      confirmPassword: z.string().trim().min(1, "Confirm Password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Password does not match",
      path: ["confirmPassword"],
    }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().trim().min(1, "Refresh Token is not found in cookies"),
  }),
});

export const completeOAuthRegistrationSchema = z.object({
  body: z.object({
    registerToken: z.string().trim().min(1, "Register Token Session is required"),
    username: z
      .string()
      .trim()
      .min(3, "Username length must be at least 3 characters long")
      .max(50, "Username is too long")
      .regex(usernameRegex, "Username can only contain letters, numbers, and underscores"),
  }),
});

export const logoutSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().trim().min(1, "Refresh Token is not found in cookies"),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>["body"];

export type EmailVerificationBody = z.infer<typeof emailVerificationSchema>["body"];

export type ResendVerificationBody = z.infer<typeof resendVerificationSchema>["body"];

export type LoginBody = z.infer<typeof loginSchema>["body"];

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>["body"];

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>["body"];

export type CompleteOAuthRegistrationBody = z.infer<typeof completeOAuthRegistrationSchema>["body"];
