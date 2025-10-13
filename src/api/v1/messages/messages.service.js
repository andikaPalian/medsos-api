import prisma from "../../../config/client.js";
import { AppError } from "../../../utils/errorHandler.js";
import { encryptMessage, decryptMessage } from "../../../utils/encrypt.js";

export const createMessage = async ({senderId, receiverId, message, replyToId, forwardFromId}) => {
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

        const {iv, encryptedMessage} = encryptMessage(message);
        const chatRoomId = [String(senderId), String(receiverId)].sort().join("_");

        const newMessage = await prisma.message.create({
            data: {
                senderId: senderId,
                receiverId: receiverId,
                content: encryptedMessage,
                iv: iv,
                roomId: chatRoomId,
                replyToId: replyToId,
                forwardFromId: forwardFromId
            },
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

        return newMessage;
    } catch (error) {
        console.error("Error creating message: ", error);
        throw error;
    }
};

export const getMessagesByRoom = async (userId, roomId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const messages = await prisma.message.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                createdAt: "asc"
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        profilePic: true,
                        username: true
                    }
                }
            }
        });

        const isParticipant = messages.some((message) => message.senderId === userId || message.receiverId === userId);
        if (!isParticipant) {
            throw new AppError("Unauthorized: You can only access your own chats", 403);
        }

        const decryptedMessages = messages.map((message) => ({
            ...message,
            content: decryptMessage(message.content, message.iv)
        }));

        return decryptedMessages;
    } catch (error) {
        console.error("Error getting messages: ", error);
        throw error;
    }
};

export const editMessageContent = async (userId, messageId, newContent) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const message = await prisma.message.findUnique({
            where: {
                id: messageId
            }
        });
        if (!message) {
            throw new AppError("Message not found", 404);
        }

        if (message.senderId !== userId) {
            throw new AppError("Unauthorized: You can only edit your own messages", 403);
        }

        const {iv, encryptedMessage} = encryptMessage(newContent);

        const updatedMessage = await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                content: encryptedMessage,
                iv: iv,
                isEdited: true
            }
        });

        return updatedMessage;
    } catch (error) {
        console.error("Error editing message: ", error);
        throw error;
    }
};

export const deleteMessageForHimself = async (userId, messageId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const message = await prisma.message.findUnique({
            where: {
                id: messageId
            }
        });
        if (!message) {
            throw new AppError("Message not found", 404);
        }

        if (message.senderId !== userId) {
            throw new AppError("Unauthorized: You can only delete your own messages", 403);
        }

        await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                deletedFor: {
                    push: userId
                }
            }
        });
    } catch (error) {
        console.error("Error deleting message: ", error);
        throw error;
    }
};

export const deleteMessageForEveryone = async (userId, messageId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const message = await prisma.message.findUnique({
            where: {
                id: messageId
            }
        });
        if (!message) {
            throw new AppError("Message not found", 404);
        }

        if (message.senderId !== userId) {
            throw new AppError("Unauthorized: You can only delete your own messages", 403);
        }

        const hoursSinceSent = Math.floor((Date.now() - message.createdAt.getTime()) / 1000 / 60 / 60);
        if (hoursSinceSent > 24) {
            throw new AppError("Messages can be deleted only after 24 hours", 400);
        }

        await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                isDeletedForEveryone: true,
                deletedAt: new Date()
            }
        });
    } catch (error) {
        console.error("Error deleting message for everyone: ", error);
        throw error
    }
};