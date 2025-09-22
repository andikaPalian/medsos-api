import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";

export const toggleFollow = async (userId, targetUserId) => {
    try {
        if (userId === targetUserId) {
            throw new AppError("You cannot follow yourself", 400);
        }

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

        return await prisma.$transaction(async (tx) => {
            const isFollowing = await tx.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId
                    }
                }
            });
            if (isFollowing) {
                // Unfollow the user
                await tx.follow.delete({
                    where: {
                        followerId_followingId: {
                            followerId: userId,
                            followingId: targetUserId
                        }
                    }
                });

                await tx.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        followingCount: {
                            decrement: 1
                        }
                    }
                });

                await tx.user.update({
                    where: {
                        id: targetUserId
                    },
                    data: {
                        followersCount: {
                            decrement: 1
                        }
                    }
                });

                return;
            } else {
                // If the target user is private, send the request first
                if (targetUser.isPrivate) {
                    await tx.follow.create({
                        data: {
                            followerId: userId,
                            followingId: targetUserId,
                            status: "PENDING"
                        }
                    });

                    await tx.notification.create({
                        data: {
                            userId: targetUserId,
                            type: "FOLLOW_REQUEST",
                            message: `${user.username} has sent you a follow request.`,
                            isRead: false
                        }
                    });

                    return;
                }

                // Follow the user, if the target user is public
                await tx.follow.create({
                    data: {
                        followerId: userId,
                        followingId: targetUserId,
                        status: "ACCEPTED"
                    }
                });

                await tx.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        followingCount: {
                            increment: 1
                        }
                    }
                });

                await tx.user.update({
                    where: {
                        id: targetUserId
                    },
                    data: {
                        followersCount: {
                            increment: 1
                        }
                    }
                });

                await tx.notification.create({
                    data: {
                        userId: targetUserId,
                        type: "FOLLOW",
                        message: `${user.username} has followed you.`,
                        isRead: false
                    }
                });

                return;
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

export const getMutualFollowers = async (userId, targetUserId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const myFollowing = await prisma.follow.findMany({
            where: {
                followerId: userId,
                status: "ACCEPTED"
            },
            select: {
                followingId: true
            }
        });

        const targetFollowers = await prisma.follow.findMany({
            where: {
                followingId: targetUserId,
                status: "ACCEPTED"
            },
            select: {
                followerId: true
            }
        });

        const myFollowingIds = myFollowing.map((following) => following.followingId);
        const targetFollowersIds = targetFollowers.map((followers) => followers.followerId);

        // Find intersection of myFollowingIds and targetFollowersIds
        const mutualIds = myFollowingIds.filter((id) => targetFollowersIds.includes(id));

        // Get users data from mutualIds
        const mutualUsers = await prisma.user.findMany({
            where: {
                id: {
                    in: mutualIds
                }
            },
            select: {
                id: true,
                profilePic: true,
                username: true
            }
        });

        return mutualUsers;
    } catch (error) {
        console.error("Error getting mutual followers: ", error);
        throw error;
    }
};

export const suggestedUsers = async (userId, {limit = 10}) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Get all users who are currently being followed
        const following = await prisma.follow.findMany({
            where: {
                followerId: userId,
                status: "ACCEPTED"
            },
            select: {
                followingId: true
            }
        });

        const followingIds = following.map((f) => f.followingId);

        // Search for "friends of friends" 
        const friendsOfFriends = await prisma.follow.findMany({
            where: {
                followerId: {
                    in: followingIds
                },
                status: "ACCEPTED",
                followingId: {
                    notIn: [...followingIds, userId] // Exclude user who is currently being followed and the user itself
                }
            },
            select: {
                following: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            },
            take: limit
        });

        // Take random user as fallback
        const randomUser = await prisma.user.findMany({
            where: {
                id: {
                    notIn: [...followingIds, userId]
                }
            },
            select: {
                id: true,
                profilePic: true,
                username: true
            },
            take: limit,
            orderBy: {
                createdAt: "desc"
            }
        });

        // Merge result
        const suggestion = [
            ...friendsOfFriends.map((f) => f.following),
            ...randomUser
        ];

        // Remove duplicates if any
        const uniqueSuggestion = [
            ...new Map(suggestion.map((user) => [user.id])).values(),
        ];

        return uniqueSuggestion.slice(0, limit);
    } catch (error) {
        console.error("Error getting suggested users: ", error);
        throw error;
    }
};