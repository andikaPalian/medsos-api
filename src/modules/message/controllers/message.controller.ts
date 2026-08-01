import { Response } from "express";
import * as messageService from "../services/messages.service.js";
import {
  AttachmentIdParam,
  GetMessagesParams,
  GetMessagesQuery,
  MessageIdParam,
  SendMessageBody,
  UpdateMessageBody,
  UpdateMessageParams,
} from "../validators/message.validation.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import { getSocketServer } from "../../../socket/registry.js";

export const sendMessage = authHandler(
  async (
    req: AuthenticatedRequest<any, any, SendMessageBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const senderId = req.user.id;
    const { receiverId, message, replyToId, forwardFromId } = req.body;
    const uploadFile = req.file as Express.Multer.File | undefined;

    const newMessage = await messageService.createMessage({
      senderId,
      receiverId,
      message,
      replyToId,
      forwardFromId,
      uploadFile,
    });

    getSocketServer().to(`user:${receiverId}`).emit("message:new", newMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  },
);

export const getMessages = authHandler(
  async (
    req: AuthenticatedRequest<GetMessagesParams, any, any, any, GetMessagesQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { roomId } = req.params;
    const { limit, cursor } = req.validatedQuery;

    const result = await messageService.getMessageByRoom({
      userId,
      roomId,
      cursor: cursor ?? null,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const updateMessage = authHandler(
  async (
    req: AuthenticatedRequest<UpdateMessageParams, any, UpdateMessageBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { newMessage } = req.body;

    const updatedMessage = await messageService.editMessageContent(userId, messageId, newMessage);

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  },
);

export const purgeMessageForMe = authHandler(
  async (
    req: AuthenticatedRequest<MessageIdParam, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { messageId } = req.params;

    await messageService.deleteMessageForHimself(userId, messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: { messageId },
    });
  },
);

export const recallMessageForEveryone = authHandler(
  async (
    req: AuthenticatedRequest<MessageIdParam, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { messageId } = req.params;

    await messageService.deleteMessageForEveryone(userId, messageId);

    res.status(200).json({
      success: true,
      message: "Message recalled successfully",
      data: { messageId },
    });
  },
);

export const downloadAttachment = authHandler(
  async (
    req: AuthenticatedRequest<AttachmentIdParam, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { attachmentId } = req.params;

    const { buffer, fileName, mimeType } = await messageService.getDecryptedAttachment(
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
);

export const markMessageAsRead = authHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { messageId } = req.params;

    await messageService.markMessageAsRead(userId, messageId);

    res.status(200).json({
      success: true,
      message: "Message marked as read successfully",
    });
  },
);
