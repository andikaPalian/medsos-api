import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { transporter } from "../../../utils/email.js";

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

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
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

        // Create/Register new user
        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                isVerified: false,
                verificationToken: otp,
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

        if (user.verificationToken !== otp) {
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
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

        await prisma.user.update({
            where: {
                email: email
            },
            data: {
                verificationToken: otp,
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