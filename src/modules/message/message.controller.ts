import { Request, Response } from "express";
import { messageService as defaultMessageService } from "./message.service.js";
import { sendCreated, sendSuccess, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { getSocketServer } from "@infra/socket/socket.registry.js";
import {
  AttachmentIdParam,
  GetMessagesParams,
  GetMessagesQuery,
  MessageIdParam,
  SendMessageBody,
  UpdateMessageBody,
  UpdateMessageParams,
} from "./message.validation.js";

export const createMessageController = (service = defaultMessageService) => ({
  sendMessage: async (
    req: Request<unknown, unknown, SendMessageBody>,
    res: Response,
  ): Promise<void> => {
    const senderId = req.user!.id;
    const { receiverId, message, replyToId, forwardFromId } = req.body;
    const uploadFile = req.file as Express.Multer.File | undefined;

    const newMessage = await service.createMessage({
      senderId,
      receiverId,
      message,
      replyToId,
      forwardFromId,
      uploadFile,
    });

    getSocketServer()
      .to([`user:${receiverId}`, `user:${senderId}`])
      .emit("message:new", newMessage);

    sendCreated(res, newMessage, "Message sent successfully");
  },

  getMessages: async (
    req: Request<GetMessagesParams, unknown, unknown, GetMessagesQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { limit, cursor } = req.query;

    const result = await service.getMessageByRoom({
      userId,
      roomId,
      cursor: cursor ?? null,
      limit: limit ? Number(limit) : undefined,
    });

    sendSuccess(res, result, "Messages retrieved successfully");
  },

  updateMessage: async (
    req: Request<UpdateMessageParams, unknown, UpdateMessageBody>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { newMessage } = req.body;

    const updatedMessage = await service.editMessageContent(userId, messageId, newMessage);

    if (updatedMessage) {
      getSocketServer()
        .to([`user:${updatedMessage.receiverId}`, `user:${updatedMessage.senderId}`])
        .emit("message:updated", updatedMessage);
    }

    sendSuccess(res, updatedMessage, "Message updated successfully");
  },

  purgeMessageForMe: async (
    req: Request<MessageIdParam>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { messageId } = req.params;

    await service.deleteMessageForHimself(userId, messageId);
    sendSuccess(res, { messageId }, "Message deleted for you");
  },

  recallMessageForEveryone: async (
    req: Request<MessageIdParam>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { messageId } = req.params;

    const recalledMessage = await service.deleteMessageForEveryone(userId, messageId);

    if (recalledMessage) {
      getSocketServer()
        .to([`user:${recalledMessage.receiverId}`, `user:${recalledMessage.senderId}`])
        .emit("message:recalled", {
          messageId: recalledMessage.id,
          roomId: recalledMessage.roomId,
        });
    }

    sendSuccess(res, { messageId }, "Message recalled successfully");
  },

  downloadAttachment: async (
    req: Request<AttachmentIdParam>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { attachmentId } = req.params;

    const { buffer, fileName, mimeType } = await service.getDecryptedAttachment(
      userId,
      attachmentId,
    );

    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Content-Length": buffer.length.toString(),
    });

    res.send(buffer);
  },

  markMessageAsRead: async (
    req: Request<MessageIdParam>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { messageId } = req.params;

    const message = await service.markMessageAsRead(userId, messageId);

    if (message) {
      getSocketServer()
        .to([`user:${message.receiverId}`, `user:${message.senderId}`])
        .emit("message:read", { messageId: message.id, readBy: userId });
    }

    sendEmptySuccess(res, "Message marked as read successfully");
  },
});

export type MessageController = ReturnType<typeof createMessageController>;
export const messageController = createMessageController();
