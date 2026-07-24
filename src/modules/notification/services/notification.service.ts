import { logger } from "../../../common/utils/logger.js";
import { notificationTemplate } from "../../../common/utils/notifcationTemplate.js";
import { NotifyTargetArgs } from "../dto/notification-request.dto.js";
import * as notificationRepository from "../repositories/notification.repository.js";

export const notifiyTarget = ({
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
    .catch((error: Error) =>
      logger.error(`[NOTIFICATION SERVICE] Failed to create notification: ${error.message}`),
    );
};
