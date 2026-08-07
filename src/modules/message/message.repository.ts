import { Message, MessageDeletion, MessageType, Prisma, Room } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError } from "@core/errors/index.js";

const attachmentSummarySelect = Prisma.validator<Prisma.MessageAttachmentSelect>()({
  id: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  duration: true,
});

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
    select: attachmentSummarySelect,
  },
});

export interface AttachmentInput {
  fileUrl: string;
  fileIv: string;
  fileAuthTag: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface InsertMessageInput {
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

export interface UpdateMessageInput {
  messageId: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
}

export interface GetMessageQueryArgs {
  roomId: string;
  userId: string;
  take: number;
  cursor: string | null;
}

export type MessageWithParticipants = Prisma.MessageGetPayload<{ include: typeof MessageInclude }>;

export type MessageAttachmentResult = Prisma.MessageAttachmentGetPayload<{
  include: typeof MessageAttachmentInclude;
}>;

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createMessageRepository = (db = prisma) => ({
  findMessageById: async (messageId: string): Promise<Message | null> => {
    return db.message.findUnique({ where: { id: messageId } });
  },

  insertMessage: async (input: InsertMessageInput): Promise<MessageWithParticipants> => {
    try {
      return await db.message.create({
        data: {
          content: input.content ?? null,
          iv: input.iv ?? null,
          authTag: input.authTag ?? null,
          sender: { connect: { id: input.senderId } },
          receiver: { connect: { id: input.receiverId } },
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
        include: MessageInclude,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  findManyMessageByRoom: async ({
    roomId,
    userId,
    take,
    cursor,
  }: GetMessageQueryArgs): Promise<MessageWithParticipants[]> => {
    return db.message.findMany({
      where: {
        roomId,
        deletions: {
          none: { userId },
        },
      },
      include: MessageInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  },

  updateMessageContent: async ({
    messageId,
    encryptedContent,
    iv,
    authTag,
  }: UpdateMessageInput): Promise<MessageWithParticipants> => {
    try {
      return await db.message.update({
        where: { id: messageId },
        data: {
          content: encryptedContent,
          iv,
          authTag,
          isEdited: true,
        },
        include: MessageInclude,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  createMessageDeletion: async (messageId: string, userId: string): Promise<MessageDeletion> => {
    try {
      return await db.messageDeletion.upsert({
        where: {
          messageId_userId: { messageId, userId },
        },
        create: { messageId, userId },
        update: {},
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  markAsDeletedForEveryone: async (messageId: string): Promise<Message> => {
    try {
      return await db.message.update({
        where: { id: messageId },
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
  },

  markAsRead: async (messageId: string): Promise<Message> => {
    try {
      return await db.message.update({
        where: { id: messageId },
        data: { isRead: true },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  markRoomAsRead: async (roomId: string, userId: string): Promise<number> => {
    try {
      const result = await db.message.updateMany({
        where: {
          roomId,
          receiverId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });
      return result.count;
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  findRoomById: async (roomId: string): Promise<Room | null> => {
    return db.room.findUnique({ where: { id: roomId } });
  },

  findAttachmentById: async (attachmentId: string): Promise<MessageAttachmentResult | null> => {
    return db.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: MessageAttachmentInclude,
    });
  },

  findRoomParticipantIds: async (roomId: string): Promise<string[]> => {
    const participants = await db.roomParticipant.findMany({
      where: { roomId },
      select: { userId: true },
    });
    return participants.map((p) => p.userId);
  },

  findCoParticipantIds: async (userId: string): Promise<string[]> => {
    const rooms = await db.roomParticipant.findMany({
      where: { userId },
      select: { roomId: true },
    });
    const roomIds = rooms.map((r) => r.roomId);

    const coParticipants = await db.roomParticipant.findMany({
      where: {
        roomId: { in: roomIds },
        userId: { not: userId },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    return coParticipants.map((p) => p.userId);
  },
});

export type MessageRepository = ReturnType<typeof createMessageRepository>;
export const messageRepository = createMessageRepository();
