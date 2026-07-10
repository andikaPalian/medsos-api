import { Message, MessageDeletion, MessageType, Prisma, Room } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";

const MessageAttachmentInclude = Prisma.validator<Prisma.MessageAttachmentInclude>()({
  message: {
    select: {
      senderId: true,
      receiverId: true,
    },
  },
});

const MessageInclude = Prisma.validator<Prisma.MessageInclude>()({
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
  attachments: {
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      duration: true,
    },
  },
});

const AttachmentAndSenderInclude = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: {
      id: true,
      profilePic: true,
      username: true,
    },
  },
  attachments: true,
});

interface AttachmentInput {
  fileUrl: string;
  fileIv: string;
  fileAuthTag: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface InsertMessageInput {
  senderId: string;
  receiverId: string;
  type: MessageType;
  content?: string | null;
  iv?: string | null;
  authTag?: string | null;
  replyToId?: string | null;
  forwardFromId?: string | null;
  chatRoomId: string;
  attachment?: AttachmentInput;
}

interface UpdateMessageInput {
  messageId: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
}

interface GetMessageQueryArgs {
  roomId: string;
  userId: string;
  take: number;
  cursor: string | null;
}

type MessageWithSenderAndAttachment = Prisma.MessageGetPayload<{
  include: typeof AttachmentAndSenderInclude;
}>;

type MessageWithParticipants = Prisma.MessageGetPayload<{ include: typeof MessageInclude }>;

type MessageAttachment = Prisma.MessageAttachmentGetPayload<{
  include: typeof MessageAttachmentInclude;
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
export const insertMessage = async (
  input: InsertMessageInput,
): Promise<MessageWithSenderAndAttachment> => {
  try {
    return await prisma.message.create({
      data: {
        content: input.content ?? null,
        iv: input.iv ?? null,
        authTag: input.authTag ?? null,
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
        attachments: input.attachment
          ? {
              create: {
                fileUrl: input.attachment.fileUrl,
                fileIv: input.attachment.fileIv,
                fileAuthTag: input.attachment.fileAuthTag,
                fileName: input.attachment.fileName,
                fileSize: input.attachment.fileSize,
                mimeType: input.attachment.mimeType,
              },
            }
          : undefined,
      },
      include: AttachmentAndSenderInclude,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

// Query to find messages by room chat
export const findManyMessageByRoom = async ({
  roomId,
  userId,
  take,
  cursor,
}: GetMessageQueryArgs): Promise<MessageWithParticipants[]> => {
  return await prisma.message.findMany({
    where: {
      roomId,
      deletions: {
        none: {
          userId,
        },
      },
    },
    include: MessageInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
};

// Query to edit/update message content
export const updateMessageContent = async ({
  messageId,
  encryptedContent,
  iv,
  authTag,
}: UpdateMessageInput): Promise<Message> => {
  try {
    return await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content: encryptedContent,
        iv,
        authTag,
        isEdited: true,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

// Query to delete the message for user by userId
export const createMessageDeletion = async (
  messageId: string,
  userId: string,
): Promise<MessageDeletion> => {
  try {
    return await prisma.messageDeletion.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
      },
      update: {},
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

// Query to delete the message for everyone
export const markAsDeletedForEveryone = async (messageId: string): Promise<Message> => {
  try {
    return await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        isDeletedForEveryone: true,
        deletedAt: new Date(),
        content: null,
        iv: null,
        authTag: null,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

export const findRoomById = async (roomId: string): Promise<Room | null> => {
  return await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });
};

export const findAttachmentById = async (
  attachmentId: string,
): Promise<MessageAttachment | null> => {
  return await prisma.messageAttachment.findUnique({
    where: {
      id: attachmentId,
    },
    include: MessageAttachmentInclude,
  });
};
