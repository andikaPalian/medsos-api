import { logger } from "@core/utils/logger.js";
import { paginateCursor, clampLimit } from "@core/utils/pagination.util.js";
import { PAGINATION } from "@core/constants/app.constants.js";
import { getSocketServer } from "@infra/socket/socket.registry.js";
import { GetNotificationsDTO, NotifyTargetArgs } from "./dto/notification-request.dto.js";
import { NotificationResponseDTO, PaginatedNotificationDTO } from "./dto/notification-response.dto.js";
import { notificationRepository as defaultNotificationRepo, NotificationWithDetails } from "./notification.repository.js";
import { NotificationType } from "@prisma/client";

const MESSAGE_TEMPLATES: Record<NotificationType, string> = {
  FOLLOW: "started following you.",
  FOLLOW_REQUEST: "sent you a follow request.",
  REQUEST_ACCEPTED: "accepted your follow request.",
  LIKE: "liked your post.",
  COMMENT: "commented on your post.",
  MENTION: "mentioned you in a post.",
  MESSAGE: "sent you a message.",
  STORY_VIEW: "viewed your story.",
  REQUEST_REJECTED: "rejected your follow request.",
};

export const notificationTemplate = (
  notificationType: NotificationType,
  senderName: string,
): string => {
  const template = MESSAGE_TEMPLATES[notificationType];
  return template ? `${senderName} ${template}` : "New notification received";
};

const mapNotification = (notification: NotificationWithDetails): NotificationResponseDTO => ({
  id: notification.id,
  userId: notification.userId,
  sender: notification.sender
    ? {
        id: notification.sender.id,
        username: notification.sender.username,
        profilePic: notification.sender.profilePic,
      }
    : null,
  senderId: notification.senderId,
  type: notification.type,
  message: notification.message,
  isRead: notification.isRead,
  postId: notification.postId,
  storyId: notification.storyId,
  createdAt: notification.createdAt,
});

export const createNotificationService = (notificationRepo = defaultNotificationRepo) => ({
  notifyTarget: ({
    targetUserId,
    senderId,
    senderUsername,
    postId,
    storyId,
    type,
  }: NotifyTargetArgs): void => {
    const message = notificationTemplate(type, senderUsername);

    notificationRepo
      .createNotification({
        userId: targetUserId,
        senderId,
        type,
        postId,
        storyId,
        message,
      })
      .then((notification) => {
        getSocketServer()
          .to(`user:${targetUserId}`)
          .emit("notification:new", mapNotification(notification));
      })
      .catch((error: Error) =>
        logger.error(`[NOTIFICATION SERVICE] Failed to create notification: ${error.message}`),
      );
  },

  getNotifications: async ({
    userId,
    limit,
    cursor,
  }: GetNotificationsDTO): Promise<PaginatedNotificationDTO> => {
    const take = clampLimit(limit, PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    const rawNotifications = await notificationRepo.findNotifications({
      userId,
      take: take + 1,
      cursor,
    });
    const { items, nextCursor, hasNextPage } = paginateCursor(rawNotifications, take, (n) => n.id);

    const data = items.map(mapNotification);

    return { data, nextCursor, hasNextPage };
  },

  deleteNotification: async (userId: string, notificationId: string): Promise<boolean> => {
    const deleted = await notificationRepo.deleteNotification(userId, notificationId);
    if (!deleted) return false;

    logger.info(`[NOTIFICATION SERVICE] Notification deleted: ${notificationId} by ${userId}`);
    return true;
  },

  markNotificationAsRead: async (userId: string, notificationId: string): Promise<boolean> => {
    const marked = await notificationRepo.markNotificationAsRead(userId, notificationId);
    if (!marked) return false;

    logger.info(`[NOTIFICATION SERVICE] Notification marked as read: ${notificationId} by ${userId}`);
    return true;
  },
});

export type NotificationService = ReturnType<typeof createNotificationService>;
export const notificationService = createNotificationService();
export const notifiyTarget = notificationService.notifyTarget;
