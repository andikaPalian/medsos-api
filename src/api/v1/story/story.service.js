import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs/promises'

export const createStory = async (userId, files, isCloseFriends) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        let url;
        let urlPublicId;
        const mediaType = files.mimetype.startsWith("video/") ? "video" : "image";
        const result = await cloudinary.uploader.upload(files.path, {
            resource_type: mediaType,
            use_filename: true,
            unique_filename: true,
            folder: `stories/${mediaType}`
        });

        await fs.unlink(files.path);

        url = result.secure_url;
        urlPublicId = result.public_id;

        const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        const newStory = await prisma.story.create({
            data: {
                userId: userId,
                isCloseFriends: isCloseFriends,
                expiresAt: expiredAt
            },
            include: {
                media: true
            }
        });

        await prisma.media.create({
            data: {
                url: url,
                urlPublicId: urlPublicId,
                type: mediaType === "video" ? "VIDEO" : "IMAGE",
                storyId: newStory.id
            }
        });

        return newStory;
    } catch (error) {
        console.error("Error creating story: ", error);
        throw error;
    }
};

export const getUserStories = async (userId, viewerId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const viewer = await prisma.user.findUnique({
            where: {
                id: viewerId
            }
        });
        if (!viewer) {
            throw new AppError("Viewer not found", 404);
        }

        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: viewerId,
                    followingId: userId
                }
            }
        });

        if (user.isPrivate && !isFollowing) {
            throw new AppError("User profile is private", 403);
        }

        return await prisma.$transaction(async (tx) => {
            const stories = await tx.story.findMany({
                where: {
                    userId: userId,
                    expiresAt: {
                        gt: new Date()
                    },
                    isCloseFriends: false
                },
                include: {
                    media: true
                }
            });

            if (stories.length === 0) return [];

            await tx.storyViewer.createMany({
                data: stories.map((story) => ({
                    storyId: story.id,
                    userId: viewerId
                }))
            });

            const isStoryCloseFriends = stories.some((story) => story.isCloseFriends);
            if (isStoryCloseFriends) {
                const isCloseFriend = await tx.closeFriends.findUnique({
                    where: {
                        userId_friendId: {
                            userId: userId,
                            friendId: viewerId
                        }
                    }
                });
                if (!isCloseFriend) {
                    throw new AppError("You are not allowed to view these stories", 403);
                }

                const closeFriendsStories = stories.filter((story) => story.isCloseFriends);

                await tx.storyViewer.createMany({
                    data: closeFriendsStories.map((story) => ({
                        storyId: story.id,
                        userId: viewerId
                    }))
                });

                return closeFriendsStories;
            }

            return stories.filter((story) => !story.isCloseFriends);
        });
    } catch (error) {
        console.error("Error retrieving user stories: ", error);
        throw error;
    }
};

export const getStoryViewers = async (userId, storyId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const story = await prisma.story.findUnique({
            where: {
                id: storyId,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
        if (!story) {
            throw new AppError("Story not found", 404);
        }

        if (story.userId !== userId) {
            throw new AppError("You are not authorized to view the viewers of this story", 403);
        }

        const viewers = await prisma.storyViewer.findMany({
            where: {
                storyId: story.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });

        return viewers;
    } catch (error) {
        console.error("Error retrieving viewers of story: ", error);
        throw error;
    }
};

export const deleteStory = async (userId, storyId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const story = await prisma.story.findUnique({
            where: {
                id: storyId
            },
            include: {
                media: true
            }
        });
        if (!story) {
            throw new AppError("Story not found", 404);
        }

        if (story.userId !== userId) {
            throw new AppError("You are not authorized to delete this story", 403);
        }

        return await prisma.$transaction(async (tx) => {
            await tx.storyViewer.deleteMany({
                where: {
                    storyId: storyId
                }
            });

            const media = story.media;
            for (const mediaItem of media) {
                if (mediaItem.urlPublicId) {
                    await cloudinary.uploader.destroy(mediaItem.urlPublicId);
                }
            };

            await tx.media.deleteMany({
                where: {
                    storyId: storyId
                }
            });

            await tx.story.delete({
                where: {
                    id: storyId,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error deleting story: ", error);
        throw error;
    }
};

export const getMyStories = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const myStories = await prisma.story.findMany({
            where: {
                userId: userId,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                media: true,
                _count: {
                    select: {
                        viewers: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const isMyStories = myStories.every((story) => story.userId === userId);
        if (!isMyStories) {
            throw new AppError("You are not allowed to view these stories", 403);
        }

        // const totalStoryView = myStories.reduce((total, story) => total + story.viewers.length, 0);

        return {
            stories: myStories.map((story) => ({
                id: story.id,
                media: story.media,
                totalView: story._count.viewers,
                isCloseFriend: story.isCloseFriends,
                createdAt: story.createdAt,
                expiredAt: story.expiresAt
            })),
            // view: totalStoryView
        };
    } catch (error) {
        console.error("Error retrieving my stories: ", error);
        throw error;
    }
};

export const getStoriesFeed = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const followings = await prisma.follow.findMany({
            where: {
                followerId: userId
            },
            select: {
                followingId: true
            }
        });

        const followingIds = followings.map((following) => following.followingId);

        const stories = await prisma.story.findMany({
            where: {
                userId: {
                    in: followingIds
                },
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                media: true,
                user: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return stories;
    } catch (error) {
        console.error("Error retrieving stories feed: ", error);
        throw error;
    }
};