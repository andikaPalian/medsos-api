import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError } from "@core/errors/index.js";

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

export interface CreateNotificationInput {
  userId: string;
  senderId: string;
  type: NotificationType;
  postId: string | null;
  storyId: string | null;
  message: string;
}

export interface FindNotificationsQueryArgs {
  userId: string;
  take: number;
  cursor: string | null;
}

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createNotificationRepository = (db = prisma) => ({
  createNotification: async (input: CreateNotificationInput): Promise<NotificationWithDetails> => {
    try {
      return await db.notification.create({
        data: input,
        include: notificationInclude,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  findNotifications: async ({
    userId,
    take,
    cursor,
  }: FindNotificationsQueryArgs): Promise<NotificationWithDetails[]> => {
    return db.notification.findMany({
      where: { userId },
      include: notificationInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  },

  deleteNotification: async (userId: string, notificationId: string): Promise<boolean> => {
    try {
      const result = await db.notification.deleteMany({
        where: { id: notificationId, userId },
      });
      return result.count > 0;
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  markNotificationAsRead: async (userId: string, notificationId: string): Promise<boolean> => {
    try {
      const result = await db.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
      return result.count > 0;
    } catch (error) {
      return handlePrismaError(error);
    }
  },
});

export type NotificationRepository = ReturnType<typeof createNotificationRepository>;
export const notificationRepository = createNotificationRepository();
