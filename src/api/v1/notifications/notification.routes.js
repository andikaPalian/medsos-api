import { Router } from "express";
import * as notificationController from "./notification.controller.js";
import { userAuth } from "../../../middlewares/authMiddleware";

export const notificationRouter = Router();

notificationRouter.use(userAuth);

notificationRouter.get("/", notificationController.getUserNotifications);
notificationRouter.patch("/:notificationId", notificationController.readNotification);
notificationRouter.delete("/:notificationId", notificationController.deleteNotification);
