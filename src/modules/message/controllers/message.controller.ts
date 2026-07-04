import { Response } from "express";
import { z } from "zod";
import * as messageService from "../services/messages.service.js";
import {
  GetMessagesParams,
  GetMessagesQuery,
  messageIdParamSchema,
  sendMessageSchema,
  updateMessageSchema,
} from "../validators/message.validation.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import { authHandler } from "../../../common/utils/authHandler.js";

export const sendMessage = authHandler(
  async (
    req: AuthenticatedRequest<any, any, z.infer<typeof sendMessageSchema>["body"]>,
    res: Response,
  ): Promise<void> => {
    const senderId = req.user.id;
    const { receiverId, message, replyToId, forwardFromId } = req.body;

    const data = await messageService.createMessage({
      senderId,
      receiverId,
      message,
      replyToId,
      forwardFromId,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: data,
    });
  },
);

export const getMessages = authHandler(
  async (
    req: AuthenticatedRequest<GetMessagesParams, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { roomId } = req.params;
    const { limit, nextCursor } = req.query as unknown as GetMessagesQuery;

    const result = await messageService.getMessageByRoom(userId, roomId, {
      limit: limit,
      nextCursor: nextCursor || null,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const updateMessage = authHandler(
  async (
    req: AuthenticatedRequest<
      z.infer<typeof updateMessageSchema>["params"],
      any,
      z.infer<typeof updateMessageSchema>["body"]
    >,
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
    req: AuthenticatedRequest<z.infer<typeof messageIdParamSchema>["params"]>,
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
    req: AuthenticatedRequest<z.infer<typeof messageIdParamSchema>["params"]>,
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
