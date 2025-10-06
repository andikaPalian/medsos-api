import { type } from "os";
import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";
import {v2 as cloudinary} from "cloudinary";
import fs from 'fs/promises'

export const createPost = async (userId, caption, files) => {
    try {
        // Validate the user
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // if (!mediaUrls || mediaUrls.length === 0) {
        //     throw new AppError("At least one media is required", 400);
        // }

        return await prisma.$transaction(async (tx) => {
            // Create the post
            const post = await tx.post.create({
                data: {
                    caption: caption || null,
                    authorId: userId
                }
            });

            // Create the media for the post
            let uploadMedia = [];
            for (const file of files) {
                const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";

                const mediaFiles = await cloudinary.uploader.upload(file.path, {
                    resource_type: mediaType,
                    use_filename: true,
                    unique_filename: true,
                    folder: `posts/${mediaType}`
                });

                await fs.unlink(file.path);

                uploadMedia.push({
                    url: mediaFiles.secure_url,
                    urlPublicId: mediaFiles.public_id,
                    type: mediaType,
                    postId: post.id
                });
            }

            // Save the media to the database
            if (uploadMedia.length > 0) {
                await tx.media.createMany({
                    data: uploadMedia
                });
            }

            return await tx.post.findUnique({
                where: {
                    id: post.id
                },
                include: {
                    media: true,
                    author: {
                        select: {
                            id: true,
                            profilePic: true,
                            username: true
                        }
                    }
                }
            });
        })
    } catch (error) {
        console.error("Error creating post: ", error);
        throw error;
    }
};

export const getPostById = async (userId, postId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        return posts;
    } catch (error) {
        console.error("Error getting post by id: ", error);
        throw error;
    }
};

export const deletePost = async (userId, postId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Check if the post exists
        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        if (user.id !== post.authorId) {
            throw new AppError("Unauthorized: You can only delete your own posts", 403);
        }

        return await prisma.$transaction(async (tx) => {
            // Delete the post
            await tx.post.delete({
                whereL: {
                    id: postId
                }
            });

            await tx.media.deleteMany({
                where: {
                    postId: postId
                }
            });

            await tx.comment.deleteMany({
                where: {
                    postId: postId
                }
            });

            await tx.like.deleteMany({
                where: {
                    postId: postId
                }
            });
        });
    } catch (error) {
        console.error("Error deleting post: ", error);
        throw error;
    }
};

export const getFeed = async (userId, {page = 1, limit = 10}) => {
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

        // Feed posts from followed users
        const post = await prisma.post.findMany({
            where: {
                authorId: {
                    in: [...followingIds, userId]
                }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                },
                media: {
                    select: {
                        id: true,
                        url: true,
                        type: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            skip: skip,
            take: limitNum
        });

        return {
            posts: post,
            page: pageNum
        };
    } catch (error) {
        console.error("Error getting feed: ", error);
        throw error;
    }
};

export const updatePost = async (userId, postId, caption, files, tags) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            },
            include: {
                media: true
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        if (user.id !== post.authorId) {
            throw new AppError("Unauthorized: You can only update your own posts", 403);
        }

        return await prisma.$transaction(async (tx) => {
            const updatedData = {};

            if (caption !== undefined) updatedData.caption = caption;

            if (tags && Array.isArray(tags)) {
                // Make sure every tags is there, if not create it
                const tagsRecords = await Promise.all(
                    tags.map((name) => tx.tag.upsert({
                        where: {
                            name: name
                        },
                        update: {},
                        create: {
                            name: name
                        }
                    }))
                );

                // Delete all old relations
                await tx.tagOnPost.deleteMany({
                    where: {
                        postId: postId
                    }
                });

                // Create new relationsd
                await tx.tagOnPost.createMany({
                    data: tagsRecords.map((tag) => ({
                        postId: postId,
                        tagId: tag.id
                    }))
                });

                // Update media if there are new files
                if (files && files.length > 0) {
                    // Delete old media
                    await tx.media.deleteMany({
                        where: {
                            postId: postId
                        }
                    });

                    const urlPublicIds = post.media.map((m) => m.urlPublicId).filter((id) => id !== null);

                    // Delet from cloudinary
                    if (urlPublicIds.length > 0) {
                        await cloudinary.uploader.destroy(urlPublicIds);
                    }

                    // Upload new media
                    let uploadMedia = [];
                    for (const file of files) {
                        const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";

                        const mediaFiles = await cloudinary.uploader.upload(file.path, {
                            resource_type: mediaType,
                            use_filename: true,
                            unique_filename: true,
                            folder: `posts/${mediaType}`
                        });

                        await fs.unlink(file.path);

                        uploadMedia.push({
                            url: mediaFiles.secure_url,
                            urlPublicId: mediaFiles.public_id,
                            type: mediaType,
                            postId: post.id
                        });
                    }

                    // // Save media to the database
                    // if (uploadMedia.length > 0) {
                    //     await tx.media.createMany({
                    //         data: uploadMedia
                    //     });
                    // }

                    // Update post with new data
                    await tx.post.update({
                        where: {
                            id: postId
                        },
                        data: updatedData
                    });

                    return;
                }
            }
        });
    } catch (error) {
        console.error("Error updating post: ", error);
        throw error;
    }
};

export const likesToggle = async (userId, postId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        return await prisma.$transaction(async (tx) => {
            const isLiked = await tx.like.findUnique({
                where: {
                    userId_postId: {
                        userId: userId,
                        postId: postId
                    }
                }
            });
            if (isLiked) {
                // Unlike the post
                await tx.like.delete({
                    where: {
                        userId_postId: {
                            userId: userId,
                            postId: postId
                        }
                    }
                });

                // Decrement totalLikes
                await tx.post.update({
                    where: {
                        id: postId
                    },
                    data: {
                        totalLikes: {
                            decrement: 1
                        }
                    }
                });

                return;
            } else {
                // Like the post
                await tx.like.create({
                    data: {
                        userId: userId,
                        postId: postId
                    }
                });

                // Increment totalLikes
                await tx.post.update({
                    where: {
                        id: postId
                    },
                    data: {
                        totalLikes: {
                            increment: 1
                        }
                    }
                });

                return;
            }
        });
    } catch (error) {
        console.error("Error toggling like: ", error);
        throw error;
    }
};

export const commentOnPost = async (userId, postId, content) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        // Create the comment
        const comment = await prisma.comment.create({
            data: {
                content: content,
                authorId: userId,
                postId: postId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });

        return comment;
    } catch (error) {
        console.error("Error creating comment: ", error);
        throw error;
    }
};

export const replyToComment = async (userId, postId, commentId, content) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        const parentComment = await prisma.comment.findUnique({
            where: {
                id: commentId
            }
        });
        if (!parentComment) {
            throw new AppError("Parent comment not found", 404);
        }

        // Create the reply comment
        const replyComment = await prisma.comment.create({
            data: {
                content: content,
                authorId: userId,
                postId: postId,
                parentId: commentId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });

        return replyComment;
    } catch (error) {
        console.error("Error creating reply comment: ", error);
        throw error;
    }
};

export const getCommentsByPost = async (userId, postId, {page = 1, limit = 10}) => {
    try {
        const pageNum = Number(page);
        const limitNum = Numberlk(limit);
        const skip = (pageNum - 1) * limitNum;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        const comments = await prisma.comment.findMany({
            where: {
                postId: postId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                profilePic: true,
                                username: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        replies: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            skip: skip,
            take: limitNum
        });

        return {
            comments: comments,
            page: pageNum
        }
    } catch (error) {
        console.error("Error getting comments by post: ", error);
        throw error;
    }
};

export const deleteComment = async (userId, postId, commentId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId
            }
        });
        if (!comment) {
            throw new AppError("Comment not found", 404);
        }

        if (user.id !== comment.authorId) {
            throw new AppError("Unauthorized: You can only delete your own comments", 403);
        }

        return await prisma.$transaction(async (tx) => {
            // Delete the comment
            await tx.comment.delete({
                where: {
                    id: commentId
                }
            });

            // Delete all replies to the comment
            if (comment.parentId === null) {
                await tx.comment.deleteMany({
                    where: {
                        parentId: commentId
                    }
                });
            }

            return;
        });
    } catch (error) {
        console.error("Error deleting comment: ", error);
        throw error;
    }
}

export const savePostToggle = async (userId, postId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        return await prisma.$transaction(async (tx) => {
            const isSaved = await tx.savedPost.findUnique({
                where: {
                    userId_postId: {
                        userId: userId,
                        postId: postId
                    }
                }
            });

            if (isSaved) {
                // Unsave the post
                await tx.savedPost.delete({
                    where: {
                        userId_postId: {
                            userId: userId,
                            postId: postId
                        }
                    }
                });

                return {
                    saved: false
                };
            } else {
                // Save the post
                await tx.savedPost.create({
                    data: {
                        userId: userId,
                        postId: postId
                    }
                });

                return {
                    saved: true
                };
            }
        });
    } catch (error) {
        console.error("Error toggling save post: ", error);
        throw error;
    }
}

export const getSavedPosts = async (userId, {page = 1, limit = 10}) => {
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
            throw new AppError("User not found", 404)
        }

        const savedPosts = await prisma.savedPost.findMany({
            where: {
                userId: userId
            },
            skip: skip,
            take: limitNum,
            orderBy: {
                createdAt: "desc"
            }
        });

        return {
            savedPosts: savedPosts,
            page: pageNum
        };
    } catch (error) {
        console.log("Error getting saved posts: ", error);
        throw error;
    }
};

export const reportPost = async (userId, postId, reason) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        return await prisma.report.create({
            data: {
                reporterId: userId,
                postId: postId,
                reason: reason,
                userId: post.authorId
            }
        });
    } catch (error) {
        console.error("Error reporting post: ", error);
        throw error;
    }
};