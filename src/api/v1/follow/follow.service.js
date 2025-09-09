import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";

export const toggleFollow = async (userId, targetUserId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const targetUser = await prisma.user.findUnique({
            where: {
                id: targetUserId
            }
        });
        if (!targetUser) {
            throw new AppError("Target user not found", 404);
        }

        if (targetUser.id === userId) {
            throw new AppError("You cannot follow yourself", 400);
        }

        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        });
        if (isFollowing) {
            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId
                    }
                }
            });
        }

        // If the target user is private
        if (targetUser.isPrivate) {
            await prisma.follow.create({
                data: {
                    followerId: userId,
                    followingId: targetUserId,
                    status: "PENDING"
                }
            });

            await prisma.notification.create({
                data: {
                    userId: targetUserId,
                    type: "FOLLOW_REQUEST",
                    message: `${user.username} sent you a follow request`,
                    isRead: false
                }
            });
        }

        await prisma.follow.create({
            data: {
                followerId: userId,
                followingId: targetUserId,
                status: "ACCEPTED"
            }
        });

        await prisma.notification.create({
            data: {
                userId: targetUserId,
                type: "FOLLOW",
                message: `${user.username} followed you`,
                isRead: false
            }
        });
    } catch (error) {
        console.error("Error following user: ", error);
        throw error;
    }
};

export const listRequests = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const requests = await prisma.follow.findMany({
            where: {
                followingId: userId,
                status: "PENDING"
            },
            select: {
                follower: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });
        if (requests.length === 0) {
            return {
                success: true,
                message: "No requests found",
                data: []
            };
        }

        return requests;
    } catch (error) {
        console.error("Error listing requests: ", error);
        throw error;
    }
};