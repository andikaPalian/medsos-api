import {z} from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long").max(50, "Username must be at most 50 characters long").trim(),
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    password: z.string().regex(passwordRegex, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character").trim()
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    password: z.string().regex(passwordRegex, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character").trim()
});