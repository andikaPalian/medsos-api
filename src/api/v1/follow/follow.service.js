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

export const acceptRequest = async (userId, followerId) => {
    try {
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: {
                    id: userId
                }
            });
            if (!user) {
                throw new AppError("User not found", 404)
            }

            const follower = await tx.user.findUnique({
                where: {
                    id: followerId
                }
            });
            if (!follower) {
                throw new AppError("Follower not found", 404);
            }

            const request = await tx.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: followerId,
                        followingId: userId
                    }
                }
            });
            if (!request) {
                throw new AppError("Request not found", 404);
            }

            if (request.status !== "PENDING") {
                throw new AppError("This request is not pending", 400);
            }

            await tx.follow.update({
                where: {
                    followerId_followingId: {
                        followerId: followerId,
                        followingId: userId
                    }
                },
                data: {
                    status: "ACCEPTED"
                }
            });

            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    followersCount: {
                        increment: 1
                    }
                }
            });

            await tx.user.update({
                where: {
                    id: followerId
                },
                data: {
                    followingCount: {
                        increment: 1
                    }
                }
            });

            await tx.notification.create({
                data: {
                    userId: followerId,
                    type: "REQUEST_ACCEPTED",
                    message: `${user.username} accepted your follow request`,
                    isRead: false
                }
            });
        });
    } catch (error) {
        console.error("Error accepting request: ", error);
        throw error;
    }
};

export const rejectRequest = async (userId, followerId) => {
    try {
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: {
                    id: userId
                }
            });
            if (!user) {
                throw new AppError("User not found", 404);
            }

            const follower = await tx.user.findUnique({
                where: {
                    id: followerId
                }
            });
            if (!follower) {
                throw new AppError("Follower not found", 404);
            }

            const request = await tx.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: followerId,
                        followingId: userId
                    }
                }
            });
            if (!request) {
                throw new AppError("Request not found", 404);
            }

            if (request.status !== "PENDING") {
                throw new AppError("This request is not pending", 400);
            }

            await tx.follow.update({
                where: {
                    followerId_followingId: {
                        followerId: followerId,
                        followingId: userId
                    }
                },
                data: {
                    status: "REJECTED"
                }
            });

            await tx.notification.create({
                data: {
                    userId: followerId,
                    type: "REQUEST_REJECTED",
                    message: `${user.username} rejected your follow request`,
                    isRead: false
                }
            });
        });
    } catch (error) {
        console.error("Error rejecting request: ", error);
        throw error;
    }
};