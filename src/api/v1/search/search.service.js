import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";

export const searchUserByUsername = async (userId, {search = "", page = 1, limit = 10}) => {
    try {
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!search.trim()) {
            return [];
        }

        const targetUser = await prisma.user.findMany({
            where: {
                username: {
                    contains: search,
                    mode: "insensitive"
                },
                NOT: {
                    id: userId
                }
            },
            select: {
                id: true,
                profilePic: true,
                username: true
            },
            skip: skip,
            take: limitNum
        });

        return {
            users: targetUser,
            page: pageNum
        };
    } catch (error) {
        console.error("Error searching user by username: ", error);
        throw error;
    }
};
