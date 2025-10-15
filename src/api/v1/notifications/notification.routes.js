import express from "express";
import { createNotificationController, deleteNotificationController, getNotificationsController, markNotificationAsReadController } from "./notification.controller.js";
import { userAuth } from "../../../middlewares/userMiddleware.js";

export const notificationRouter = express.Router();

notificationRouter.post("/", userAuth, createNotificationController);
notificationRouter.get("/", userAuth, getNotificationsController);
notificationRouter.patch("/:notificationId", userAuth, markNotificationAsReadController);
notificationRouter.delete("/:notificationId", userAuth, deleteNotificationController);