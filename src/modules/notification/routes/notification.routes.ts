import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import * as notificationValidator from "../validations/notification.validator.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";

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
