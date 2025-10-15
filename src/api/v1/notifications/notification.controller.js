import { createNotification, deleteNotification, getNotifications, markNotificationAsRead } from "./notification.service";

export const createNotificationController = async (req, res, next) => {
    try {
        const senderId = req.user.userId;
        const {receiverId, type, postId, storyId} = req.body;

        const newNotification = await createNotification(senderId, receiverId, type, postId, storyId);

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: newNotification
        });
    } catch (error) {
        next(error);
    }
};

export const getNotificationsController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const notifications = await getNotifications(userId);

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsReadController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {notificationId} = req.params;

        await markNotificationAsRead(userId, notificationId);
        
        return res.status(200).json({
            success: true,
            message: "Notification marked as read successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const deleteNotificationController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {notificationId} = req.params;

        await deleteNotification(userId, notificationId);

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};