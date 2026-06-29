import { Message, MessageDeletion } from "@prisma/client";
import * as messageRepository from "../repositories/message.repository.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import { logger } from "../../../common/utils/logger.js";
import { AppError } from "../../../common/error/errorHandler.js";
import { decryptMessage, encryptMessage } from "../../../common/utils/encrypt.js";
import { CreateMessageArgs, PaginatedMessageResponse } from "../dto/messageService.js";

const RECALL_MESSAGE_WINDOW_HOURS = 24;
const DEFAULT_CHAT_LIMIT = 30;

type MessageWithSender = Message & {
  sender: {
    id: string;
    profilePic: string | null;
    username: string;
  };
};

// Service for create a new message
export const createMessage = async ({
  senderId,
  receiverId,
  message,
  replyToId,
  forwardFromId,
}: CreateMessageArgs): Promise<MessageWithSender> => {
  const [sender, receiver] = await Promise.all([
    userRepository.findUserById(senderId),
    userRepository.findUserById(receiverId),
  ]);

  if (!sender) {
    logger.warn(`[MESSAGE SERVICE] Failed attempt: Sender Id ${senderId} not found.`);
    throw new AppError("Sender not found", 404);
  }

  if (!receiver) {
    logger.warn(`[MESSAGE SERVICE] Failed attempt: Receiver Id ${receiverId} not found.`);
    throw new AppError("Receiver not found", 404);
  }

  const { iv, encryptedMessage } = encryptMessage(message);
  const chatRoomId = [String(senderId), String(receiverId)].sort().join("_");

  const newMessage = await messageRepository.insertMessage({
    senderId,
    receiverId,
    content: encryptedMessage,
    iv,
    replyToId,
    forwardFromId,
    chatRoomId,
  });

  logger.info(`[MESSAGE SERVICE] Message successfully sent in Room: ${chatRoomId}`);

  return newMessage;
};

// Service for get all message in a room chat
export const getMessageByRoom = async (
  userId: string,
  roomId: string,
  { limit = 30, nextCursor = null }: { limit?: number; nextCursor?: string | null } = {},
): Promise<PaginatedMessageResponse> => {
  const roomPartisipants = roomId.split("_");
  if (!roomPartisipants.includes(String(userId))) {
    logger.warn(`[MESSAGE SERVICE] User ${userId} unauthorized access attempt to Room: ${roomId}`);
    throw new AppError("Unauthorized: You are not a participant of this chat room.", 403);
  }

  const take = Math.abs(limit) || DEFAULT_CHAT_LIMIT;

  const messages = await messageRepository.findManyMessageByRoom({
    roomId,
    userId,
    take: take + 1,
    nextCursor,
  });

  let hasNextPage = false;
  let cursor: string | null = null;

  const messageArray = [...messages];
  if (messageArray.length > take) {
    hasNextPage = true;
    const nextItem = messageArray.pop();
    cursor = nextItem ? nextItem.id : null;
  }

  const formattedMessages = messageArray.reverse().map((msg) => {
    const decryptedMessage = decryptMessage(msg.content, msg.iv);

    if (!decryptedMessage && !msg.isDeletedForEveryone) {
      logger.error(`[MESSAGE SERVICE] Failed to decrypt message ${msg.id} in Room ${roomId}`);
    }

    return {
      ...msg,
      content: msg.isDeletedForEveryone
        ? "This message was deleted."
        : (decryptedMessage ?? "Failed to decrypt message"),
    };
  });

  return {
    success: true,
    data: formattedMessages,
    pagination: {
      hasNextPage,
      nextCursor: cursor,
    },
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

  const { iv, encryptedMessage } = encryptMessage(newContent);
  return await messageRepository.updateMessageContent(messageId, encryptedMessage, iv);
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
