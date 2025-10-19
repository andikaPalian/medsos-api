import {z} from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long").max(30, "Username must be at most 30 characters long").trim(),
    email: z.email("Invalid email address").trim().toLowerCase(),
    password: z.string().regex(passwordRegex, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character").trim()
});

export const loginSchema = z.object({
    email: z.email("Invalid email address").trim().toLowerCase(),
    password: z.string().regex(passwordRegex, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character").trim()
});

export const verifyEmailSchema = z.object({
    email: z.email().trim(),
    otp: z.string().trim()
});

export const resendVerificationEmailSchema = z.object({
    email: z.email().trim()
});

export const forgotPasswordSchema = z.object({
    email: z.email().trim()
});

export const resetPasswordSchema = z.object({
    token: z.string().trim(),
    newPassword: z.string().regex(passwordRegex, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character").trim()
});