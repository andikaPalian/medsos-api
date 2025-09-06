import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

        // Create/Register new user
        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword
            }
        });

        return newUser;
    } catch (error) {
        console.error("Error registering user: ", error);
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