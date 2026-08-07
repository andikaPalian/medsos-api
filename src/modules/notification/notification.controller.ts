import { Request, Response } from "express";
import { notificationService as defaultNotificationService } from "./notification.service.js";
import { sendSuccess } from "@infra/http/helpers/response.helper.js";
import { GetNotificationsQuery, NotificationActionParams } from "./notification.validation.js";

export const createNotificationController = (service = defaultNotificationService) => ({
  getNotifications: async (
    req: Request<unknown, unknown, unknown, GetNotificationsQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { limit, cursor } = req.query;

    const notifications = await service.getNotifications({
      userId,
      limit: limit ? Number(limit) : 10,
      cursor: cursor ?? null,
    });

    sendSuccess(res, notifications, "Notifications retrieved successfully");
  },

  deleteNotification: async (
    req: Request<NotificationActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const deleted = await service.deleteNotification(userId, notificationId);
    sendSuccess(res, { deleted, notificationId }, "Notification deleted successfully");
  },

  markNotificationAsRead: async (
    req: Request<NotificationActionParams>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const updated = await service.markNotificationAsRead(userId, notificationId);
    sendSuccess(res, { updated, notificationId }, "Notification marked as read");
  },
});

export type NotificationController = ReturnType<typeof createNotificationController>;
export const notificationController = createNotificationController();
