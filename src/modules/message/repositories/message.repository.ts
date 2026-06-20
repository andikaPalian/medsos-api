import { Message, MessageDeletion, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";

interface InsertMessageInput {
  senderId: string;
  receiverId: string;
  content: string;
  iv: string;
  replyToId?: string | null;
  forwardFromId?: string | null;
  chatRoomId: string;
}

interface GetMessageQueryArgs {
  roomId: string;
  userId: string;
  take: number;
  nextCursor: string | null;
}

type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        profilePic: true;
        username: true;
      };
    };
  };
}>;

type MessageWithParticipants = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        profilePic: true;
        username: true;
      };
    };
    receiver: {
      select: {
        id: true;
        profilePic: true;
        username: true;
      };
    };
  };
}>;


// Query to find message by message id
export const findMessageById = async (messageId: string): Promise<Message | null> => {
  return await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });
};

// Query to insert a new message
export const insertMessage = async (input: InsertMessageInput): Promise<MessageWithSender> => {
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
}: GetMessageQueryArgs): Promise<MessageWithParticipants[]> => {
  const queryOptions: Prisma.MessageFindManyArgs = {
    where: {
      roomId,
      deletions: {
        none: {
          userId
        }
      }
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

  const messages = await prisma.message.findMany(queryOptions);
  return messages as MessageWithParticipants[];
};

// Query to edit/update message content
export const updateMessageContent = async (
  messageId: string,
  encryptedContent: string,
  iv: string,
): Promise<Message> => {
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
export const createMessageDeletion = async (messageId: string, userId: string): Promise<MessageDeletion> => {
  return await prisma.messageDeletion.create({
    data: {
      messageId: messageId,
      userId: userId
    }
  })
};

// Query to delete the message for everyone
export const markAsDeletedForEveryone = async (messageId: string): Promise<Message> => {
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
