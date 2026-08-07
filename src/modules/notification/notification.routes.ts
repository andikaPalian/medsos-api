import { Router } from "express";
import { notificationController } from "./notification.controller.js";
import * as notificationValidator from "./notification.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const notificationRouter = Router();

notificationRouter.use(userAuth);

notificationRouter.get(
  "/",
  validate(notificationValidator.getNotificationsSchema),
  notificationController.getNotifications,
);

notificationRouter.delete(
  "/:notificationId",
  validate(notificationValidator.notificationActionSchema),
  notificationController.deleteNotification,
);

notificationRouter.patch(
  "/:notificationId/read",
  validate(notificationValidator.notificationActionSchema),
  notificationController.markNotificationAsRead,
);
