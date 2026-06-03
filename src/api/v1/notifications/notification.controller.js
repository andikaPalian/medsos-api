import { catchAsync } from "../../../utils/catchAsync.js";
import * as notificationService from "./notification.service.js";

// Controller fot get user notifications
export const getUserNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { limit, nextCursor } = req.query;

  const notifications = await notificationService.getNotifications(userId, { limit, nextCursor });

  return res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data: notifications.data,
    pagination: notifications.pagination,
  });
});

// Controller for mark notification as read
export const readNotification = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  await notificationService.markNotificationAsRead(userId, notificationId);

  return res.status(200).json({
    success: true,
    message: "Notification marked as read successfully",
    data: {
      notificationId: notificationId,
    },
  });
});

// Controller for delete notification
export const deleteNotification = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  await notificationService.deleteNotification(userId, notificationId);

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
    data: {
      notificationId: notificationId,
    },
  });
});
