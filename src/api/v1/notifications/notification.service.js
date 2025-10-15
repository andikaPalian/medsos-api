import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";

export const createNotification = async (senderId, receiverId, type, postId, storyId) => {
    try {
        const sender = await prisma.user.findUnique({
            where: {
                id: senderId
            }
        });
        if (!sender) {
            throw new AppError("Sender not found", 404);
        }

        const receiver = await prisma.user.findUnique({
            where: {
                id: receiverId
            }
        });
        if (!receiver) {
            throw new AppError("Receiver not found", 404);
        }

        let message = "";
        switch (type) {
            case "FOLLOW":
                message = `${sender.username} started following you.`;
                break;
            
            case "FOLLOW_REQUEST":
                message = `${sender.username} sent you a follow request.`;
                break;

            case "REQUEST_ACCEPTED":
                message = `${sender.username} accepted your follow request.`;
                break;

            case "LIKE":
                message = `${sender.username} liked your post.`;
                break;

            case "COMMENT":
                message = `${sender.username} commented on your post.`;
                break;

            case "MENTION":
                message = `${sender.username} mentioned you in a post.`;
                break;

            case "MESSAGE":
                message = `${sender.username} sent you a message.`;
                break;

            case "STORY_VIEW":
                message = `${sender.username} viewed your story.`;
                break;

            case "REQUEST_REJECTED":
                message = `${sender.username} rejected your follow request.`;
                break;
        
            default:
                throw new AppError("Invalid notification type", 400);
        }

        // Make payload notification
        const notificationData = {
            userId: receiverId,
            senderId: senderId,
            type,
            message,
            isRead: false
        };

        if (postId) {
            notificationData.postId = postId
        }

        if (storyId) {
            notificationData.storyId = storyId;
        }

        const newNotification = await prisma.notification.create({
            data: notificationData,
            include: {
                sender: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });

        return newNotification;
    } catch (error) {
        console.error("Error creating notification: ", error);
        throw error;
    }
};

export const getNotifications = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId
            },
            include: {
                sender: {
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

        return notifications;
    } catch (error) {
        console.error("Error getting notifications: ", error);
        throw error;
    }
};

export const markNotificationAsRead = async (userId, notificationId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId
            }
        });
        if (!notification) {
            throw new AppError("Notification not found", 404);
        }

        if (notification.userId !== userId) {
            throw new AppError("Unauthorized: You can only mark your own notifications as read", 403);
        }

        await prisma.notification.update({
            where: {
                id: notificationId
            },
            data: {
                isRead: true
            }
        });
    } catch (error) {
        console.error("Error marking notification as read: ", error);
        throw error;
    }
};

export const deleteNotification = async (userId, notificationId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId
            }
        });
        if (!notification) {
            throw new AppError("Notification not found", 404);
        }

        if (notification.senderId !== userId) {
            throw new AppError("Unauthorized: You can only delete your own notifications", 403);
        }

        await prisma.notification.delete({
            where: {
                id: notificationId
            }
        });
    } catch (error) {
        console.error("Error deleting notification: ", error);
        throw error;
    }
};