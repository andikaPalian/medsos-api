import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

export const updateProfile = async (userId, file, data) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.id !== userId) {
            throw new AppError("Unauthorized: You can only update your own profile", 403);
        }

        const {username, fullName, email, bio} = data;

        const updateData = {};

        // Cloudinary
        let profilePic = user.profilePic;
        let profilePublicId = user.profilePublicId;

        if (file) {
            if (user.profilePublicId) {
                await cloudinary.uploader.destroy(user.profilePublicId)
            }

            const result = await cloudinary.uploader.upload(file.path, {
                folder: "profile-pictures",
                resource_type: "image",
                use_filename: true,
                unique_filename: true,
            });

            await fs.unlink(file.path);

            profilePic = result.secure_url;
            profilePublicId = result.public_id;

            updateData.profilePic = profilePic;
            updateData.profilePublicId = profilePublicId;
        }

        if (username !== undefined) updateData.username = username;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (email !== undefined) updateData.email = email;
        if (bio !== undefined) updateData.bio = bio;

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: updateData
        });

        return updatedUser;
    } catch (error) {
        console.error("Error updating user profile: ", error);
        throw error;
    }
};

export const getUserProfile = async (userId, targetUserId) => {
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
            },
            select: {
                id: true,
                profilePic: true,
                username: true,
                fullName: true,
                bio: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    }
                },
                posts: true,
            }
        });
        if (!targetUser) {
            throw new AppError("User not found", 404);
        }

        const isFollowing = await prisma.follow.findFirst({
            where: {
                followerId: userId,
                followingId: targetUserId
            }
        })

        if (targetUser.isPrivate && !isFollowing) {
            return {
                id: targetUser.id,
                profilePic: targetUser.profilePic,
                username: targetUser.username,
                fullName: targetUser.fullName,
                bio: targetUser.bio,
                totalFollowers: targetUser._count.followers,
                totalFollowing: targetUser._count.following,
                totalPosts: targetUser._count.posts,
                post: "This profile is private"
            };
        }

        const userProfile = {
            id: targetUser.id,
            profilePic: targetUser.profilePic,
            username: targetUser.username,
            fullName: targetUser.fullName,
            bio: targetUser.bio,
            totalFollowers: targetUser._count.followers,
            totalFollowing: targetUser._count.following,
            totalPosts: targetUser._count.posts,
            post: targetUser.posts || []
        };

        return userProfile;
    } catch (error) {
        console.error("Error getting user profile: ", error);
        throw error;
    }
};

export const togglePrivateAccount = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.id !== userId) {
            throw new AppError("Unauthorized: You can only update your own profile", 403);
        }

        // If the user is private
        if (user.isPrivate) {
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    isPrivate: false
                }
            });
        } else {
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    isPrivate: true
                }
            });
        }
    } catch (error) {
        console.error("Error toggling private account: ", error);
        throw error;
    }
};

export const listFollowers = async (userId, targetUserId) => {
    try {
        const targetUser = await prisma.user.findUnique({
            where: {
                id: targetUserId
            },
            select: {
                id: true,
                isPrivate: true
            }
        });
        if (!targetUser) {
            throw new AppError("Target user not found", 404);
        }

        // If the target user is not yourself
        if (userId !== targetUserId) {
            // If the target user is private
            if (targetUser.isPrivate) {
                const isFollowing = await prisma.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: userId,
                            followingId: targetUserId
                        }
                    }
                });
                if (!isFollowing) {
                    throw new AppError("You are not following this user", 400);
                }
            }
        }

        const followers = await prisma.follow.findMany({
            where: {
                followingId: targetUserId
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

        return followers
    } catch (error) {
        console.error("Error listing followers: ", error);
        throw error;
    }
};

export const listFollowing = async (userId, targetUserId) => {
    try {
        const targetUser = await prisma.user.findUnique({
            where: {
                id: targetUserId
            },
            select: {
                id: true,
                isPrivate: true
            }
        });
        if (!targetUser) {
            throw new AppError("Target user not found", 404);
        }

        // If the target user is not yourself
        if (userId !== targetUserId) {
            // If the target user is private
            if (targetUser.isPrivate) {
                const isFollowing = await prisma.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: userId,
                            followingId: targetUserId
                        }
                    }
                });
                if (!isFollowing) {
                    throw new AppError("You are not following this user", 400);
                }
            }
        }

        const following = await prisma.follow.findMany({
            where: {
                followerId: targetUserId
            },
            select: {
                following: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });

        return following;
    } catch (error) {
        console.error("Error listing following: ", error);
        throw error;
    }
};

export const updateCloseFriends = async (userId, targetUserId) => {
    try {
        const targetUser = await prisma.user.findUnique({
            where: {
                id: targetUserId
            },
            select: {
                id: true,
                isPrivate: true
            }
        });
        if (!targetUser) {
            throw new AppError("Target user not found", 404);
        }

        if (userId === targetUserId) {
            throw new AppError("You cannot add yourself as a close friend", 400);
        }

        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        });
        if (!isFollowing) {
            throw new AppError("You are not following this user", 400);
        }

        // If the target user is private, check if the user is a follower
        if (targetUser.isPrivate) {
            if (isFollowing.status !== "ACCEPTED") {
                throw new AppError("You are not a follower of this user", 400);
            }
        }

        const isCloseFriend = await prisma.closeFriends.findUnique({
            where: {
                userId_friendId: {
                    userId: userId,
                    friendId: targetUserId
                }
            }
        });
        if (isCloseFriend) {
            await prisma.closeFriends.delete({
                where: {
                    userId_friendId: {
                        userId: userId,
                        friendId: targetUserId
                    }
                }
            });
        } else {
            await prisma.closeFriends.create({
                data: {
                    userId: userId,
                    friendId: targetUserId
                }
            });
        }
    } catch (error) {
        console.error("Error updating close friends: ", error);
        throw error;
    }
};

export const listCloseFriends = async (userId) => {
    try {
        const closeFriends = await prisma.closeFriends.findMany({
            where: {
                userId: userId
            },
            select: {
                friend: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });

        return closeFriends;
    } catch (error) {
        console.error("Error listing close friends: ", error);
        throw error;
    }
};

export const removeFollower = async (userId, followerId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const follower = await prisma.user.findUnique({
            where: {
                id: followerId
            }
        });
        if (!follower) {
            throw new AppError("Follower not found", 404);
        }

        if (user.id !== userId) {
            throw new AppError("Unauthorized: You can only update your own profile", 403);
        }
        
        const isFollower = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: followerId,
                    followingId: userId
                }
            }
        });
        if (!isFollower) {
            throw new AppError("Target user is not a follower of you", 400);
        }
        
        if (isFollower.status !== "ACCEPTED") {
            throw new AppError("Target user is not a follower of you", 400);
        }

        await prisma.$transaction(async (tx) => {
            await tx.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: followerId,
                        followingId: userId
                    }
                }
            });

            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    followersCount: {
                        decrement: 1
                    }
                }
            });

            await tx.user.update({
                where: {
                    id: followerId
                },
                data: {
                    followingCount: {
                        decrement: 1
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error removing follower: ", error);
        throw error;
    }
};