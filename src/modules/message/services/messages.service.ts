import { Message, MessageDeletion, MessageType } from "@prisma/client";
import * as messageRepository from "../repositories/message.repository.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import * as blockRepository from "../../block/repositories/block.repository.js";
import * as mediaService from "../../media/services/media.service.js";
import { logger } from "../../../common/utils/logger.js";
import { AppError } from "../../../common/error/errorHandler.js";
import {
  decryptMessage,
  encryptMessage,
  MessageDecryptionError,
} from "../../../common/utils/encryptText.js";
import { CreateMessageDTO, GetMessagesDTO } from "../dto/message-request.dto.js";
import {
  AttachmentData,
  DecryptedAttachmentDTO,
  MessageAttachmentSummaryDTO,
  MessageWithSenderAndAttachments,
  PaginatedMessagesDTO,
} from "../dto/message-response.dto.js";
import { paginateCursor } from "../../../common/utils/pagination.js";
import { decryptFile, encryptFile } from "../../../common/utils/encryptFile.js";

const RECALL_MESSAGE_WINDOW_HOURS = 24;
const DEFAULT_CHAT_LIMIT = 30;

const MAX_LIMIT = 50;

const deriveMessageType = (mimeType: string): MessageType => {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
};

// Service for create a new message
export const createMessage = async ({
  senderId,
  receiverId,
  message,
  replyToId,
  forwardFromId,
  uploadFile,
}: CreateMessageDTO): Promise<MessageWithSenderAndAttachments> => {
  if (!message && !uploadFile) throw new AppError("Message must contain text or attachment", 400);
  const receiver = await userRepository.findUserById(receiverId);
  if (!receiver) {
    logger.warn(`[MESSAGE SERVICE] Failed attempt: Receiver Id ${receiverId} not found.`);
    throw new AppError("Receiver not found", 404);
  }

  const isBlocked = await blockRepository.isBlockedEitherWay(senderId, receiverId);
  if (isBlocked) {
    logger.warn(`[MESSAGE SERVICE] Blocked message attempt between ${senderId} and ${receiverId}`);
    throw new AppError("You cannot send messages to this user", 403);
  }

  const chatRoomId = [String(senderId), String(receiverId)].sort().join("_");

  if (replyToId) {
    const originalMessage = await messageRepository.findMessageById(replyToId);
    if (!originalMessage || originalMessage.roomId !== chatRoomId) {
      throw new AppError("Cannot reply to a message from a different conversation", 400);
    }
  }

  if (forwardFromId) {
    const originalMessage = await messageRepository.findMessageById(forwardFromId);
    if (!originalMessage) throw new AppError("Original message not found", 404);

    const isParticipant =
      originalMessage.senderId === senderId || originalMessage.receiverId === senderId;
    if (!isParticipant) throw new AppError("You can only forward messages you have access to", 403);
  }

  const textResult = message ? encryptMessage(message) : null;

  let attachmentData: AttachmentData | undefined = undefined;
  let messageType: MessageType = "TEXT";

  if (uploadFile) {
    const { iv, fileAuthTag, encryptedBuffer } = encryptFile(uploadFile.buffer);
    const uploaded = await mediaService.uploadMessageAttachment(
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

  const newMessage = await messageRepository.insertMessage({
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

  return newMessage;
};

// Service for get all message in a room chat
export const getMessageByRoom = async ({
  userId,
  roomId,
  cursor,
  limit,
}: GetMessagesDTO): Promise<PaginatedMessagesDTO> => {
  const room = await messageRepository.findRoomById(roomId);
  if (!room) throw new AppError("Room messages not found", 404);

  const roomPartisipants = roomId.split("_");
  if (!roomPartisipants.includes(String(userId))) {
    logger.warn(`[MESSAGE SERVICE] User ${userId} unauthorized access attempt to Room: ${roomId}`);
    throw new AppError("Unauthorized: You are not a participant of this chat room.", 403);
  }

  const take = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_CHAT_LIMIT));

  const messages = await messageRepository.findManyMessageByRoom({
    roomId,
    userId,
    take: take + 1,
    cursor,
  });

  const { items, nextCursor, hasNextPage } = paginateCursor(messages, take, (m) => m.id);

  const formattedMessages = items.reverse().map((msg) => {
    let content: string;

    if (msg.isDeletedForEveryone) {
      content = "This message was deleted.";
    } else {
      try {
        const decryptedMessage = decryptMessage(msg.content, msg.iv, msg.authTag);
        content = decryptedMessage ?? "Failed";
      } catch (error) {
        if (error instanceof MessageDecryptionError) {
          logger.error(`[MESSAGE SERVICE] Failed to decrypt message ${msg.id} in Room ${roomId}`);
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
  });

  return {
    data: formattedMessages,
    nextCursor,
    hasNextPage,
  };
};

// Service for edit message content
export const editMessageContent = async (
  userId: string,
  messageId: string,
  newContent: string,
): Promise<Message> => {
  const message = await messageRepository.findMessageById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (message.senderId !== userId) {
    logger.warn(
      `[MESSAGE SERVICE] User ${userId} attempted to edit message ${messageId} owned by User ${message.senderId}`,
    );
    throw new AppError("Unauthorized: You can only manipulate your own message.", 403);
  }

  const isBlocked = await blockRepository.isBlockedEitherWay(userId, message.receiverId);
  if (isBlocked) {
    logger.warn(
      `[MESSAGE SERVICE] Blocked message attempt between ${userId} and ${message.senderId}`,
    );
    throw new AppError("You cannot edit this message", 403);
  }

  const { iv, authTag, encryptedMessage } = encryptMessage(newContent);
  return await messageRepository.updateMessageContent({
    messageId,
    encryptedContent: encryptedMessage,
    iv,
    authTag,
  });
};

// Service for delete message for my self
export const deleteMessageForHimself = async (
  userId: string,
  messageId: string,
): Promise<MessageDeletion> => {
  const message = await messageRepository.findMessageById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (message.senderId !== userId && message.receiverId !== userId) {
    logger.warn(
      `[MESSAGE SERVICE] User ${userId} attempted to delete on message ${messageId} without membership.`,
    );
    throw new AppError("Unauthorized: You are not a participant of this chat", 403);
  }

  return await messageRepository.createMessageDeletion(messageId, userId);
};

// Service for delete message for everyone
export const deleteMessageForEveryone = async (
  userId: string,
  messageId: string,
): Promise<Message> => {
  const message = await messageRepository.findMessageById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (message.senderId !== userId) {
    logger.warn(
      `[MESSAGE SERVICE] User ${userId} attempted to delete message ${messageId} owned by ${message.senderId}`,
    );
    throw new AppError("Unauthorized: You can only delete your own message.", 403);
  }

  const hourSinceSent = Math.floor((Date.now() - message.createdAt.getTime()) / 1000 / 60 / 60);
  if (hourSinceSent > RECALL_MESSAGE_WINDOW_HOURS) {
    logger.warn(
      `[MESSAGE SERVICE] Recall rejected: Message ${messageId} passed the 24h window (${hourSinceSent}h).`,
    );
    throw new AppError("Message only can recalled within 24 hours window", 400);
  }

  return await messageRepository.markAsDeletedForEveryone(messageId);
};

export const getDecryptedAttachment = async (
  userId: string,
  attachmentId: string,
): Promise<DecryptedAttachmentDTO> => {
  const attachment = await messageRepository.findAttachmentById(attachmentId);
  if (!attachment) throw new AppError("Attachment not found", 404);

  const { senderId, receiverId } = attachment.message;
  if (senderId !== userId && receiverId !== userId) {
    logger.warn(`[MESSAGE SERVICE] Unauthorized access attempt: ${attachmentId} by ${userId}`);
    throw new AppError("Unauthorized: You are not a participant of this chat", 403);
  }

  const response = await fetch(attachment.fileUrl);
  if (!response.ok) {
    logger.error(
      `[MESSAGE SERVICE] Failed to fetch attachment from storage: ${attachment.fileUrl}`,
    );
    throw new AppError("Failed to retrieve attachment", 500);
  }
  const encryptedBuffer = Buffer.from(await response.arrayBuffer());

  const decryptedBuffer = decryptFile(encryptedBuffer, attachment.fileIv, attachment.fileAuthTag);

  return {
    buffer: decryptedBuffer,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
  };
};
