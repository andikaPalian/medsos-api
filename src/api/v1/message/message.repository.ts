import { Message, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import {
  GetMessageQueryArgs,
  InsertMessageInput,
} from "../../../types/messages/messageRepository.js";

// Query to find user by user id
export const findUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
};

// Query to find message by message id
export const findMessageById = async (messageId: string): Promise<Message | null> => {
  return await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });
};

// Query to insert a new message
export const insertMessage = async (input: InsertMessageInput) => {
  return await prisma.message.create({
    data: {
      content: input.content,
      iv: input.iv,
      sender: {
        connect: {
          id: input.senderId,
        },
      },
      receiver: {
        connect: {
          id: input.receiverId,
        },
      },
      replyTo: input.replyToId ? { connect: { id: input.replyToId } } : undefined,
      forwardFrom: input.forwardFromId ? { connect: { id: input.forwardFromId } } : undefined,
      room: {
        connectOrCreate: {
          where: { id: input.chatRoomId },
          create: { id: input.chatRoomId },
        },
      },
    },
    include: {
      sender: {
        select: {
          id: true,
          profilePic: true,
          username: true,
        },
      },
    },
  });
};

// Query to find messages by room chat
export const findManyMessageByRoom = async ({
  roomId,
  userId,
  take,
  nextCursor,
}: GetMessageQueryArgs) => {
  const queryOptions: Prisma.MessageFindManyArgs = {
    where: {
      roomId,
      NOT: {
        deletedFor: {
          has: userId,
        },
      },
    },
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: {
        select: {
          id: true,
          profilePic: true,
          username: true,
        },
      },
      receiver: {
        select: {
          id: true,
          profilePic: true,
          username: true,
        },
      },
    },
  };

  if (nextCursor) {
    queryOptions.cursor = { id: nextCursor };
    queryOptions.skip = 1;
  }

  return await prisma.message.findMany(queryOptions);
};

// Query to edit/update message content
export const updateMessageContent = async (
  messageId: string,
  encryptedContent: string,
  iv: string,
) => {
  return await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      content: encryptedContent,
      iv,
      isEdited: true,
    },
  });
};

// Query to delete the message for user by userId
export const pushUserToDeleteFor = async (messageId: string, userId: string) => {
  return await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      deletedFor: {
        push: userId,
      },
    },
  });
};

// Query to delete the message for everyone
export const markAsDeletedForEveryone = async (messageId: string) => {
  return await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      isDeletedForEveryone: true,
      deletedAt: new Date(),
      content: "This message was deleted.",
      iv: "",
    },
  });
};
