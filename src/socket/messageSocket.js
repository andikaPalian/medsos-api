import { encryptMessage, decryptMessage } from "../utils/encrypt.js";
import prisma from "../config/client.js";
import { onlineUsers } from "./onlineUsers.js";
import validator from "validator";
import moment from "moment";

export const messageSocket = (socket, io) => {
    // Set user connected, save to onklineUsers
    socket.on("user_connected", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} connected with socket id: ${socket.id}`);
    });

    socket.on("typing", ({chatRoomId, senderId, isTyping}) => {
        io.to(chatRoomId).emit("typing", {
            senderId,
            isTyping
        });
    });

    // Event: User sends message
    socket.on("send_message", async ({senderId, receiverId, message, replyToId, forwardFromId}) => {
        try {
            if (typeof message !== "string" || !validator.isLength(message, {min: 1})) {
                return socket.emit('error', 'Message must be at least 1 character long.');
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
                    replyToId: replyToId, // Use direct ID
                    forwardFromId: forwardFromId // Use direct ID
                }
            });

            // Get relation data if exists
            const replyMessage = replyToId ? await prisma.message.findUnique({
                where: {
                    id: replyToId
                }
            }) : null;
            const forwardMessage = forwardFromId ? await prisma.message.findUnique({
                where: {
                    id: forwardFromId
                }
            }) : null;

            // Send message to receiver
            io.to(chatRoomId).emit("receive_message", {
                messageId: newMessage.id,
                senderId: senderId,
                message: decryptMessage(newMessage.content, newMessage.iv),
                timestamps: newMessage.createdAt,
                replyTo: replyMessage ? {
                    messageId: replyMessage.id,
                    senderId: replyMessage.senderId,
                    message: decryptMessage(replyMessage.content, replyMessage.iv)
                } : null,
                forwardFrom: forwardMessage ? {
                    messageId: forwardMessage.id,
                    senderId: forwardMessage.senderId,
                    message: decryptMessage(forwardMessage.content, forwardMessage.iv)
                } : null
            });

            socket.emit("message_sent", {
                messageId: newMessage.id,
                chatRoomId
            });
            console.log(`Message sent from ${senderId} to ${receiverId}`);
        } catch (error) {
            console.error("Error sending message: ", error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Event: User read messages
    socket.on("read_message", async ({messageId}) => {
        try {
            const updatedMessage = await prisma.message.update({
                where: {
                    id: messageId
                },
                data: {
                    isRead: true
                }
            });

            const senderSocketId = onlineUsers.get(updatedMessage.senderId.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit("message_read", {messageId});
            }
            console.log(`Message ${messageId} marked as read`);
        } catch (error) {
            console.error("Error marking message as read: ", error);
            socket.emit('error', 'Failed to mark message as read');
        }
    });

    // Event: User deletes message for himself
    socket.on("delete_message", async ({messageId, userId}) => {
        try {
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
            console.log(`Message ${messageId} deleted for user ${userId}`);
            socket.emit('message_deleted_for_me', {messageId});
        } catch (error) {
            console.error("Error deleting message for me: ", error);
            socket.emit('error', 'Failed to delete message for me');
        }
    });

    // Event: User delete message for all users
    socket.on("delete_message_for_all", async ({messageId, senderId}) => {
        try {
            const message = await prisma.message.findUnique({
                where: {
                    id: messageId
                }
            });
            if (!message) return socket.emit('error', 'Message not found');
            if (message.senderId !== senderId) return socket.emit('error', 'Unauthorized: You can only delete your own messages');

            const hourSinceSent = moment().diff(message.createdAt, 'hours');
            if (hourSinceSent < 24) return socket.emit('error', 'Message can only be deleted within 24 hours');

            await prisma.message.update({
                where: {
                    id: messageId
                },
                data: {
                    isDeletedForEveryone: true,
                    deletedAt: new Date()
                }
            });

            console.log(`Message ${messageId} deleted for everyone`);
            io.to(message.roomId).emit('message_deleted_for_everyone', {messageId: message.id});
        } catch (error) {
            console.error("Error deleting message for everyone: ", error);
            socket.emit('error', 'Failed to delete message for everyone');
        }
    });

    // Event User edit message
    socket.on('edit_message', async ({messageId, newMessage, senderId}) => {
        try {
            const message = await prisma.message.findUnique({
                where: {
                    id: messageId
                }
            });
            if (!message) return socket.emit('error', 'Message not found');
            if (message.senderId !== senderId) return socket.emit('error', 'Unauthorized: You can only edit your own messages');

            const {iv, encryptedMessage} = encryptMessage(newMessage);

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

            console.log(`Message ${messageId} edited by ${senderId}`);
            io.to(message.roomId).emit('message_edited', {
                messageId: updatedMessage.id,
                newMessage: decryptMessage(updatedMessage.content, updatedMessage.iv),
                timestamps: updatedMessage.updatedAt
            });
        } catch (error) {
            console.error("Error editing message: ", error);
            socket.emit('error', 'Failed to edit message');
        }
    });

    // Event: User join chat room
    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room ${roomId}`);
    });

    // Event: User leave chat room
    socket.on("leave_room", (roomId) => {
        socket.leave(roomId);
        console.log(`User left room ${roomId}`);
    });

    // Event: If user disconnects
    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
}