import { NotificationType } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";

interface CreateNotificationInput {
  userId: string;
  senderId: string;
  type: NotificationType;
  postId: string;
  message: string;
}

export const createNotification = async (input: CreateNotificationInput): Promise<void> => {
  try {
    await prisma.notification.create({
      data: input,
    });
  } catch (error) {
    handlePrismaError(error);
  }
};
