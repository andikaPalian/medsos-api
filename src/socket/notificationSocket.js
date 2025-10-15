import { createNotification, deleteNotification, markNotificationAsRead } from "../api/v1/notifications/notification.service.js";
import { onlineUsers } from "./onlineUsers.js";

export const notificationSocket = (socket, io) => {
    socket.on("user_connected", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} connected with socket id: ${socket.id}`);
    });

    socket.on("send_notification", async (data) => {
        try {
            const newNotification = await createNotification(data);

            const receiveSocketId = onlineUsers.get(newNotification.userId.toString());
            if (receiveSocketId) {
                io.to(receiveSocketId).emit("receive_notification", {
                    notificationId: newNotification.id,
                    senderId: newNotification.senderId,
                    type: newNotification.type,
                    postId: newNotification.postId,
                    storyId: newNotification.storyId,
                    timestamps: newNotification.createdAt
                });
            }
        } catch (error) {
            console.error("Error sending notification: ", error);
            socket.emit("error", "Failed to send notification.");
        }
    });

    socket.on("read_notification", async (notificationId, receiverId) => {
        try {
            await markNotificationAsRead(receiverId, notificationId);

            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("notification_read", notificationId);
            }
        } catch (error) {
            console.error("Error reading notification: ", error);
            socket.emit("error", "Failed to read notification.");
        }
    });

    socket.on("delete_notification", async (notificationId, receiverId) => {
        try {
            await deleteNotification(receiverId, notificationId);

            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("notification_deleted", notificationId);
            }
        } catch (error) {
            console.error("Error deleting notification: ", error);
            socket.emit("error", "Failed to delete notification.");
        }
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User ${userId} disconnected. Total online users: ${onlineUsers.size}`);
            }
        }
    });
};