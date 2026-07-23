import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";

const notificationInclude = Prisma.validator<Prisma.NotificationInclude>()({
  sender: {
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  },
  post: {
    select: {
      id: true,
    },
  },
  story: {
    select: {
      id: true,
    },
  },
});

export type NotificationWithDetails = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

interface CreateNotificationInput {
  userId: string;
  senderId: string;
  type: NotificationType;
  postId: string;
  storyId: string;
  message: string;
}

interface FindNotificationsQueryArgs {
  userId: string;
  take: number;
  cursor: string | null;
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

export const findNotifications = async ({
  userId,
  take,
  cursor,
}: FindNotificationsQueryArgs): Promise<NotificationWithDetails[]> => {
  return await prisma.notification.findMany({
    where: {
      userId,
    },
    include: notificationInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
};

export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  try {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string,
): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
};
