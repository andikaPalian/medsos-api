import prisma from "../../config/client.js";

// Query for find the sender by userId
export const findSenderById = async (senderId) => {
  return await prisma.user.findUnique({
    where: {
      id: senderId,
    },
    select: {
      username: true,
    },
  });
};

// Query for create a notification
export const createNotification = async ({
  receiverId,
  senderId,
  type,
  message,
  postId,
  storyId,
}) => {
  return await prisma.notification.create({
    data: {
      userId: receiverId,
      senderId: senderId,
      type: type,
      message: message,
      postId: postId || null,
      storyId: storyId || null,
    },
    include: {
      sender: {
        select: {
          username: true,
        },
      },
    },
  });
};

// Query for find the notifications
export const findNotifications = async ({ userId, take, nextCursor }) => {
  const queryOptions = {
    where: {
      userId: userId,
    },
    take: take,
    include: {
      sender: {
        select: {
          id: true,
          profilePic: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  };

  // If there's a cursor, enter the prisma cursor navigation
  if (nextCursor) {
    queryOptions.cursor = { id: nextCursor };
    queryOptions.skip = 1;
  }

  return await prisma.notification.findMany(queryOptions);
};

// Query for mark the notifications as read
export const markNotificationAsRead = async (userId, notificationId) => {
  return await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: userId,
    },
    data: {
      isRead: true,
    },
  });
};

// Query for delete the notifications
export const deleteNotification = async (userId, notificationId) => {
  return await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId: userId,
    },
  });
};
