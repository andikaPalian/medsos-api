import { AppServer, AppSocket } from "@core/types/socket.types.js";
import { logger } from "@core/utils/logger.js";
import { notificationService as defaultNotificationService } from "./notification.service.js";
import { notificationRepository as defaultNotificationRepo } from "./notification.repository.js";
import { NotificationType } from "@prisma/client";

export const registerNotificationHandlers = (
  io: AppServer,
  socket: AppSocket,
  notificationService = defaultNotificationService,
  notificationRepo = defaultNotificationRepo,
): void => {
  const currentUserId = socket.data?.userId;
  if (!currentUserId) {
    logger.error(
      "[NOTIFICATION SOCKET] Connection rejected: Missing authenticated user state on socket instance.",
    );
    socket.disconnect(true);
    return;
  }

  socket.on(
    "send_notification" as any,
    async (data: { receiverId: string; type: NotificationType; postId: string | null; storyId: string | null }) => {
      try {
        const newNotification = await notificationRepo.createNotification({
          userId: data.receiverId,
          senderId: currentUserId,
          type: data.type,
          postId: data.postId,
          storyId: data.storyId,
          message: "New notification",
        });

        const targetUserId = String(newNotification.userId);

        io.to(`user:${targetUserId}`).emit("notification:new", {
          id: newNotification.id,
          userId: newNotification.userId,
          senderId: newNotification.senderId,
          sender: newNotification.sender,
          type: newNotification.type,
          postId: newNotification.postId,
          storyId: newNotification.storyId,
          message: newNotification.message,
          isRead: newNotification.isRead,
          createdAt: newNotification.createdAt,
        });
      } catch (error) {
        const err = error as Error;
        logger.error(`[NOTIFICATION SOCKET] Send failed: ${err.message}`);
        socket.emit("error", { message: "Failed to send notification." });
      }
    },
  );

  socket.on(
    "read_notification" as any,
    async (notificationId: string) => {
      try {
        await notificationService.markNotificationAsRead(currentUserId, notificationId);
        io.to(`user:${currentUserId}`).emit("notification_read" as any, notificationId as any);
      } catch (error) {
        const err = error as Error;
        logger.error(`[NOTIFICATION SOCKET] Read failed: ${err.message}`);
        socket.emit("error", { message: "Failed to read notification." });
      }
    },
  );

  socket.on(
    "delete_notification" as any,
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(currentUserId, notificationId);
        io.to(`user:${currentUserId}`).emit("notification_deleted" as any, notificationId as any);
      } catch (error) {
        const err = error as Error;
        logger.error(`[NOTIFICATION SOCKET] Delete failed: ${err.message}`);
        socket.emit("error", { message: "Failed to delete notification." });
      }
    },
  );
};
