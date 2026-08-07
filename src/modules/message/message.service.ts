import { Message, MessageDeletion, MessageType } from "@prisma/client";
import { NotFoundError, ForbiddenError, BadRequestError, InternalServerError, MessageDecryptionError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { encryptMessage, decryptMessage, encryptFile, decryptFile } from "@core/utils/crypto.util.js";
import { uploadAttachmentToCloudinary } from "@core/utils/cloudinary.util.js";
import { paginateCursor, clampLimit } from "@core/utils/pagination.util.js";
import { MESSAGE } from "@core/constants/app.constants.js";
import { CreateMessageDTO, GetMessagesDTO } from "./dto/message-request.dto.js";
import {
  AttachmentData,
  DecryptedAttachmentDTO,
  MessageAttachmentSummaryDTO,
  MessageResponse,
  PaginatedMessagesDTO,
} from "./dto/message-response.dto.js";
import { messageRepository as defaultMessageRepo, MessageWithParticipants } from "./message.repository.js";
import { userRepository as defaultUserRepo } from "@modules/user/user.repository.js";
import { blockRepository as defaultBlockRepo } from "@modules/block/block.repository.js";

const deriveMessageType = (mimeType: string): MessageType => {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
};

const mapMessageResponse = (
  msg: MessageWithParticipants,
  roomId?: string,
): MessageResponse => {
  let content: string;

  if (msg.isDeletedForEveryone) {
    content = "This message was deleted.";
  } else {
    try {
      const decryptedMessage = decryptMessage(msg.content, msg.iv, msg.authTag);
      content = decryptedMessage ?? "";
    } catch (error) {
      if (error instanceof MessageDecryptionError) {
        logger.error(
          `[MESSAGE SERVICE] Failed to decrypt message ${msg.id}${roomId ? ` in Room ${roomId}` : ""}`,
        );
        content = "Failed to decrypt message";
      } else {
        throw error;
      }
    }
  }

  const attachments: MessageAttachmentSummaryDTO[] = msg.attachments.map((att) => ({
    id: att.id,
    fileName: att.fileName,
    fileSize: att.fileSize,
    mimeType: att.mimeType,
    duration: att.duration,
  }));

  return {
    id: msg.id,
    type: msg.type,
    content,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    sender: msg.sender,
    receiver: msg.receiver,
    isRead: msg.isRead,
    isEdited: msg.isEdited,
    isDeletedFromEveryone: msg.isDeletedForEveryone,
    replyToId: msg.replyToId,
    forwardFromId: msg.forwardFromId,
    attachments,
  };
};

export const createMessageService = (
  messageRepo = defaultMessageRepo,
  userRepo = defaultUserRepo,
  blockRepo = defaultBlockRepo,
) => ({
  createMessage: async ({
    senderId,
    receiverId,
    message,
    replyToId,
    forwardFromId,
    uploadFile,
  }: CreateMessageDTO): Promise<MessageResponse> => {
    if (!message && !uploadFile) throw new BadRequestError("Message must contain text or attachment");

    const receiver = await userRepo.findUserById(receiverId);
    if (!receiver) {
      logger.warn(`[MESSAGE SERVICE] Failed attempt: Receiver Id ${receiverId} not found.`);
      throw new NotFoundError("Receiver");
    }

    const isBlocked = await blockRepo.isBlockedEitherWay(senderId, receiverId);
    if (isBlocked) {
      logger.warn(`[MESSAGE SERVICE] Blocked message attempt between ${senderId} and ${receiverId}`);
      throw new ForbiddenError("You cannot send messages to this user");
    }

    const chatRoomId = [String(senderId), String(receiverId)].sort().join("_");

    if (replyToId) {
      const originalMessage = await messageRepo.findMessageById(replyToId);
      if (!originalMessage || originalMessage.roomId !== chatRoomId) {
        throw new BadRequestError("Cannot reply to a message from a different conversation");
      }
    }

    if (forwardFromId) {
      const originalMessage = await messageRepo.findMessageById(forwardFromId);
      if (!originalMessage) throw new NotFoundError("Original message");

      const isParticipant =
        originalMessage.senderId === senderId || originalMessage.receiverId === senderId;
      if (!isParticipant) throw new ForbiddenError("You can only forward messages you have access to");
    }

    const textResult = message ? encryptMessage(message) : null;
    let attachmentData: AttachmentData | undefined = undefined;
    let messageType: MessageType = "TEXT";

    if (uploadFile) {
      const { iv, fileAuthTag, encryptedBuffer } = encryptFile(uploadFile.buffer);
      const uploaded = await uploadAttachmentToCloudinary(
        encryptedBuffer,
        uploadFile.originalname,
      );

      attachmentData = {
        fileUrl: uploaded.url,
        fileIv: iv,
        fileAuthTag,
        fileName: uploadFile.originalname,
        fileSize: uploadFile.size,
        mimeType: uploadFile.mimetype,
      };
      messageType = deriveMessageType(uploadFile.mimetype);
    }

    const newMessage = await messageRepo.insertMessage({
      senderId,
      receiverId,
      type: messageType,
      content: textResult?.encryptedMessage ?? null,
      iv: textResult?.iv ?? null,
      authTag: textResult?.authTag ?? null,
      replyToId,
      forwardFromId,
      chatRoomId,
      attachment: attachmentData,
    });

    logger.info(`[MESSAGE SERVICE] Message successfully sent in Room: ${chatRoomId}`);
    return mapMessageResponse(newMessage);
  },

  getMessageByRoom: async ({
    userId,
    roomId,
    cursor,
    limit,
  }: GetMessagesDTO): Promise<PaginatedMessagesDTO> => {
    const room = await messageRepo.findRoomById(roomId);
    if (!room) throw new NotFoundError("Room messages");

    const roomParticipants = await messageRepo.findRoomParticipantIds(roomId);
    if (!roomParticipants.includes(userId)) {
      logger.warn(`[MESSAGE SERVICE] User ${userId} unauthorized access attempt to Room: ${roomId}`);
      throw new ForbiddenError("You are not a participant of this chat room.");
    }

    const take = clampLimit(limit, MESSAGE.DEFAULT_LIMIT, MESSAGE.MAX_LIMIT);

    const messages = await messageRepo.findManyMessageByRoom({
      roomId,
      userId,
      take: take + 1,
      cursor,
    });

    const { items, nextCursor, hasNextPage } = paginateCursor(messages, take, (m) => m.id);
    const formattedMessages = items.reverse().map((msg) => mapMessageResponse(msg, roomId));

    return {
      data: formattedMessages,
      nextCursor,
      hasNextPage,
    };
  },

  editMessageContent: async (
    userId: string,
    messageId: string,
    newContent: string,
  ): Promise<MessageResponse> => {
    const message = await messageRepo.findMessageById(messageId);
    if (!message) throw new NotFoundError("Message");

    if (message.senderId !== userId) {
      logger.warn(`[MESSAGE SERVICE] User ${userId} attempted to edit message ${messageId} owned by ${message.senderId}`);
      throw new ForbiddenError("You can only edit your own messages.");
    }

    const isBlocked = await blockRepo.isBlockedEitherWay(userId, message.receiverId);
    if (isBlocked) {
      logger.warn(`[MESSAGE SERVICE] Blocked message attempt between ${userId} and ${message.senderId}`);
      throw new ForbiddenError("You cannot edit this message");
    }

    const { iv, authTag, encryptedMessage } = encryptMessage(newContent);
    const updatedMessage = await messageRepo.updateMessageContent({
      messageId,
      encryptedContent: encryptedMessage,
      iv,
      authTag,
    });

    return mapMessageResponse(updatedMessage);
  },

  markMessageAsRead: async (userId: string, messageId: string): Promise<Message> => {
    const message = await messageRepo.findMessageById(messageId);
    if (!message) throw new NotFoundError("Message");
    if (message.receiverId !== userId) {
      throw new ForbiddenError("You are not the receiver of this message.");
    }
    return messageRepo.markAsRead(messageId);
  },

  markMessageRoomAsRead: async (userId: string, roomId: string): Promise<number> => {
    const room = await messageRepo.findRoomById(roomId);
    if (!room) throw new NotFoundError("Room");

    const participants = await messageRepo.findRoomParticipantIds(roomId);
    if (!participants.includes(userId)) {
      throw new ForbiddenError("You are not a participant of this chat room.");
    }

    return messageRepo.markRoomAsRead(roomId, userId);
  },

  deleteMessageForHimself: async (userId: string, messageId: string): Promise<MessageDeletion> => {
    const message = await messageRepo.findMessageById(messageId);
    if (!message) throw new NotFoundError("Message");

    if (message.senderId !== userId && message.receiverId !== userId) {
      logger.warn(`[MESSAGE SERVICE] User ${userId} attempted to delete message ${messageId} without membership.`);
      throw new ForbiddenError("You are not a participant of this chat");
    }

    return messageRepo.createMessageDeletion(messageId, userId);
  },

  deleteMessageForEveryone: async (userId: string, messageId: string): Promise<Message> => {
    const message = await messageRepo.findMessageById(messageId);
    if (!message) throw new NotFoundError("Message");

    if (message.senderId !== userId) {
      logger.warn(`[MESSAGE SERVICE] User ${userId} attempted to delete message ${messageId} owned by ${message.senderId}`);
      throw new ForbiddenError("You can only delete your own messages.");
    }

    const hourSinceSent = Math.floor((Date.now() - message.createdAt.getTime()) / 1000 / 60 / 60);
    if (hourSinceSent > MESSAGE.RECALL_WINDOW_HOURS) {
      logger.warn(`[MESSAGE SERVICE] Recall rejected: Message ${messageId} passed 24h window (${hourSinceSent}h).`);
      throw new BadRequestError("Message can only be recalled within a 24-hour window");
    }

    return messageRepo.markAsDeletedForEveryone(messageId);
  },

  getDecryptedAttachment: async (
    userId: string,
    attachmentId: string,
  ): Promise<DecryptedAttachmentDTO> => {
    const attachment = await messageRepo.findAttachmentById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment");

    const { senderId, receiverId } = attachment.message;
    if (senderId !== userId && receiverId !== userId) {
      logger.warn(`[MESSAGE SERVICE] Unauthorized access attempt: ${attachmentId} by ${userId}`);
      throw new ForbiddenError("You are not a participant of this chat");
    }

    const response = await fetch(attachment.fileUrl);
    if (!response.ok) {
      logger.error(`[MESSAGE SERVICE] Failed to fetch attachment: ${attachment.fileUrl}`);
      throw new InternalServerError("Failed to retrieve attachment from storage");
    }
    const encryptedBuffer = Buffer.from(await response.arrayBuffer());

    const decryptedBuffer = decryptFile(encryptedBuffer, attachment.fileIv, attachment.fileAuthTag);

    return {
      buffer: decryptedBuffer,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  },
});

export type MessageService = ReturnType<typeof createMessageService>;
export const messageService = createMessageService();
