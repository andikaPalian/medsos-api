import { logger } from "../../../common/utils/logger.js";
import { notificationTemplate } from "../../../common/utils/notifcationTemplate.js";
import { paginateCursor } from "../../../common/utils/pagination.js";
import { GetNotificationsDTO, NotifyTargetArgs } from "../dto/notification-request.dto.js";
import {
  NotificationResponseDTO,
  PaginatedNotificationDTO,
} from "../dto/notification-response.dto.js";
import * as notificationRepository from "../repositories/notification.repository.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const mapNotification = (
  notification: notificationRepository.NotificationWithDetails,
): NotificationResponseDTO => ({
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

export const notifyTarget = ({
  io,
  targetUserId,
  senderId,
  senderUsername,
  postId,
  storyId,
  type,
}: NotifyTargetArgs): void => {
  const message = notificationTemplate(type, senderUsername);

  notificationRepository
    .createNotification({
      userId: targetUserId,
      senderId,
      type,
      postId,
      storyId,
      message,
    })
    .then((notification) => {
      io.to(`user:${targetUserId}`).emit("notification:new", mapNotification(notification));
    })
    .catch((error: Error) =>
      logger.error(`[NOTIFICATION SERVICE] Failed to create notification: ${error.message}`),
    );
};

export const getNotifications = async ({
  userId,
  limit,
  cursor,
}: GetNotificationsDTO): Promise<PaginatedNotificationDTO> => {
  const take = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));

  const rawNotifications = await notificationRepository.findNotifications({
    userId,
    take: take + 1,
    cursor,
  });
  const { items, nextCursor, hasNextPage } = paginateCursor(rawNotifications, take, (n) => n.id);

  const data = items.map(mapNotification);

  return {
    data,
    nextCursor,
    hasNextPage,
  };
};

export const deleteNotification = async (
  userId: string,
  notificationId: string,
): Promise<boolean> => {
  const deleted = await notificationRepository.deleteNotification(userId, notificationId);

  if (!deleted) return false;

  logger.info(`[NOTIFICATION SERVICE] Notification deleted: ${notificationId} by ${userId}`);
  return true;
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string,
): Promise<boolean> => {
  const marked = await notificationRepository.markNotificationAsRead(userId, notificationId);

  if (!marked) return false;

  logger.info(`[NOTIFICATION SERVICE] Notification marked as read: ${notificationId} by ${userId}`);
  return true;
};
