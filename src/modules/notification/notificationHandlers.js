import * as notificationService from "../notifications/notification.service.js";
import logger from "../../../utils/logger.js";

export const registerNotificationHandlers = (socket, io) => {
  const currentUserId = socket.user?.id;
  if (!currentUserId) {
    logger.error(
      "[NOTIFICATION SOCKET] Connection rejected: Missing authenticated user state on socket instance.",
    );
    return socket.disconnect(true);
  }

  // Send notification trigger
  socket.on("send_notification", async (data) => {
    try {
      const newNotification = await notificationService.createNotification({
        senderId: currentUserId,
        receiverId: data.receiverId,
        type: data.type,
        postId: data.postId,
        storyId: data.storyId,
      });

      const targetUserId = String(newNotification.userId);

      io.to(`user:${targetUserId}`).emit("receive_notification", {
        notificationId: newNotification.id,
        senderId: newNotification.senderId,
        type: newNotification.type,
        postId: newNotification.postId,
        storyId: newNotification.storyId,
        message: newNotification.message,
        timestamps: newNotification.createdAt,
      });
    } catch (error) {
      logger.error(`[NOTIFICATION SOCKET] Send failed: ${error.message}`);
      socket.emit("error", error.statusCode ? error.message : "Failed to send notification.");
    }
  });

  // Read notification trigger
  socket.on("read_notification", async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(currentUserId, notificationId);

      io.to(`user:${currentUserId}`).emit("notification_read", notificationId);
    } catch (error) {
      logger.error(`[NOTIFICATION SOCKET] Read failed: ${error.message}`);
      socket.emit("error", error.statusCode ? error.message : "Failed to read notification.");
    }
  });

  // Delete notification trigger
  socket.on("delete_notification", async (notificationId) => {
    try {
      await notificationService.deleteNotification(currentUserId, notificationId);

      io.to(`user:${currentUserId}`).emit("notification_deleted", notificationId);
    } catch (error) {
      logger.error(`[NOTIFICATION SOCKET] Delete failed: ${error.message}`);
      socket.emit("error", error.statusCode ? error.message : "Failed to delete notification.");
    }
  });
};
