import { Request, Response, NextFunction } from "express";
import * as messageService from "./messages.service.js";
import { catchAsync } from "../../../utils/catchAsync.js";

export const sendMessage = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
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

export const getMessages = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user.id;
    const { roomId } = req.params;
    const { limit, nextCursor } = req.query;

    const result = await messageService.getMessageByRoom(userId, roomId, {
      limit: limit ? Number(limit) : undefined,
      nextCursor: nextCursor as string | null,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const updateMessage = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
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

export const purgeMessageForMe = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user.id;
    const { messageId } = req.params;

    await messageService.deleteMessageForHimself(userId, messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: {
        messageId: messageId,
      },
    });
  },
);

export const recallMessageForEveryone = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user.id;
    const { messageId } = req.params;

    await messageService.deleteMessageForEveryone(userId, messageId);

    res.status(200).json({
      success: true,
      message: "Message recalled successfully",
      data: {
        messageId: messageId,
      },
    });
  },
);
