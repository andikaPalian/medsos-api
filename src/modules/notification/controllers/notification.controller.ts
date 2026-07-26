import { Response } from "express";
import * as notificationService from "../services/notification.service.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import {
  GetNotificationsQuery,
  NotificationActionParams,
} from "../validations/notification.validator.js";

export const getNotifications = authHandler(
  async (
    req: AuthenticatedRequest<any, any, any, any, GetNotificationsQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { limit, cursor } = req.validatedQuery;

    const notifications = await notificationService.getNotifications({
      userId,
      limit,
      cursor: cursor ?? null,
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  },
);

export const deleteNotification = authHandler(
  async (
    req: AuthenticatedRequest<NotificationActionParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const deleted = await notificationService.deleteNotification(userId, notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      data: {
        deleted,
        notificationId,
      },
    });
  },
);

export const markNotificationAsRead = authHandler(
  async (
    req: AuthenticatedRequest<NotificationActionParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const updated = await notificationService.markNotificationAsRead(userId, notificationId);

    res.status(200).json({
      success: true,
      data: {
        updated,
        notificationId,
      },
    });
  },
);
