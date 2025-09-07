import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { transporter } from "../../../utils/email.js";

const generateOtp = () => crypto.randomInt(100000, 999999).toString();
const resetPasswordToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const register = async ({username, email, password}) => {
    try {
        // Check if user already exists
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (user) {
            throw new AppError("User already exists", 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Otp
        const otp = generateOtp();
        const hashedOtp = hashToken(otp);
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

        // Create/Register new user
        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                isVerified: false,
                verificationToken: hashedOtp,
                verificationTokenExpiry: otpExpiry
            }
        });

        // Send verification email
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: "Email Verification Code",
            text: `Your verification code is ${otp}. It is valid for 5 minutes.`
        });

        return newUser;
    } catch (error) {
        console.error("Error registering user: ", error);
        throw error;
    }
};

export const verifyEmail = async ({email, otp}) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.email !== email) {
            throw new AppError("Invalid email", 400);
        }

        const hashedOtp = hashToken(otp);

        if (user.verificationToken !== hashedOtp) {
            throw new AppError("Invalid verification code", 400);
        }

        if (user.verificationTokenExpiry < new Date()) {
            throw new AppError("Token has expired. Please request a new one");
        }

        if (user.isVerified === true) {
            throw new AppError("User is already verified", 400);
        }

        await prisma.user.update({
            where: {
                email: email
            },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null
            }
        });
    } catch (error) {
        console.error("Error verifying email: ", error);
        throw error;
    }
};

export const resendVerificationEmail = async ({email}) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.isVerified === true) {
            throw new AppError("User is already verified", 400);
        }

        if (user.verificationTokenExpiry > new Date()) {
            throw new AppError("Verification token is still valid. Please wait 5 minutes before requesting a new one", 400);
        }

        // Otp
        const otp = generateOtp();
        const hashedOtp = hashToken(otp);
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

        await prisma.user.update({
            where: {
                email: email
            },
            data: {
                verificationToken: hashedOtp,
                verificationTokenExpiry: otpExpiry
            }
        });

        // Send verification email
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: "Email Verification Code",
            text: `Your verification code is ${otp}. It is valid for 5 minutes.`
        });
    } catch (error) {
        console.error("Error resending verification email: ", error);
        throw error;
    }
};

export const login = async ({email, password}) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            throw new AppError("User not found or not registered. Please register first", 404);
        }
        
        if (user.isVerified === false) {
            throw new AppError("User is not verified. Please verify your email first", 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError("Invalid credentials", 401);
        }

        const token = jwt.sign({
            id: user.id
        }, process.env.JWT_SECRET, {
            expiresIn: "1d"
        });

        return token;
    } catch (error) {
        console.error("Error logging in user: ", error);
        throw error;
    }
};

export const forgotPassword = async ({email}) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.isVerified === false) {
            throw new AppError("User is not verified. Please verify your email first", 401);
        }

        const resetToken = resetPasswordToken();
        const hashedToken = hashToken(resetToken);
        const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // Token valid for 5 minutes

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpiry: tokenExpiry
            }
        });

        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: "Password Reset Request",
            text: `You are receiving this email because you requested a password reset. Please click the following link or paste it into your browser to reset your password: ${resetUrl}\n\n
            If you did not request a password reset, please ignore this email.`
        });
    } catch (error) {
        console.error("Error sending password reset email: ", error);
        throw error;
    }
};

export const resetPassword = async ({token, newPassword}) => {
    try {
        const hashedToken = hashToken(token);

        // Find user by tokwn and expiry date
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpiry: {
                    gt: new Date() // not expired
                }
            }
        });
        if (!user) {
            throw new AppError("Invalid or expired token", 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordTokenExpiry: null
            }
        });
    } catch (error) {
        console.error("Error resetting password: ", error);
        throw error;
    }
};