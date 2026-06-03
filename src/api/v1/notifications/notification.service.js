import * as notificationRepository from "./notification.repository.js";
import { AppError } from "../../../utils/errorHandler.js";

// Service for create a notification
export const createNotification = async ({ senderId, receiverId, type, postId, storyId }) => {
  // Check the sender
  const sender = await notificationRepository.findSenderById(senderId);
  if (!sender) throw new AppError("Notification trigger failed: Sender not found", 404);

  // Message template for each type
  const messageTemplates = {
    FOLLOW: `${sender.username} started following you.`,
    FOLLOW_REQUEST: `${sender.username} sent you a follow request.`,
    REQUEST_ACCEPTED: `${sender.username} accepted your follow request`,
    LIKE: `${sender.username} liked your post`,
    COMMENT: `${sender.username} commented on your post`,
    MENTION: `${sender.username} mentioned you in a post`,
    MESSAGE: `${sender.username} sent you a message`,
    STORY_VIEW: `${sender.username} viewed your story.`,
    REQUEST_REJECTED: `${sender.username} rejected your follow request`,
  };

  const message = messageTemplates[type];
  if (!message) throw new AppError("Invalid notification type", 400);

  return await notificationRepository.createNotification({
    receiverId: receiverId,
    senderId: senderId,
    type: type,
    message: message,
    postId: postId,
    storyId: storyId,
  });
};

// Service for get the notifications
export const getNotifications = async (userId, { limit = 20, nextCursor = null } = {}) => {
  const take = parseInt(limit, 10) || 20;

  const notifications = await notificationRepository.findNotifications({
    userId: userId,
    take: take + 1,
    nextCursor: nextCursor,
  });

  let hasNextPage = false;
  let cursor = null;

  if (notifications.length > take) {
    hasNextPage = true;
    const nextItem = notifications.pop();
    cursor = nextItem.id;
  }

  return {
    data: notifications,
    pagination: {
      hasNextPage,
      nextCursor: cursor,
    },
  };
};

// Service for mark the notification as read
export const markNotificationAsRead = async (userId, notificationId) => {
  const updateResult = await notificationRepository.markNotificationAsRead(userId, notificationId);
  if (updateResult.count === 0) throw new AppError("Notification not found or access denied", 404);
};

// Service for delete the notification
export const deleteNotification = async (userId, notificationId) => {
  const result = await notificationRepository.deleteNotification(userId, notificationId);
  if (result.count === 0) throw new AppError("Notification not found or empty", 404);
};
