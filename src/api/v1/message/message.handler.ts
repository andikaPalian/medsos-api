import { Server } from "socket.io";
import * as messageService from "./messages.service.js";
import { logger } from "../../../utils/logger.js";
import {
  AuthenticateSocket,
  DeleteMessagePayload,
  EditMessagePayload,
  SendMessagePayload,
} from "../../../types/messages/messageHandler.js";

// Register message event listener
export const registerMessageHandlers = (io: Server, socket: AuthenticateSocket) => {
  const userId = socket.user?.id;
  if (!userId) {
    logger.warn(
      `[MESSAGE SOCKET] Connection rejected: Missing user session on socket ${socket.id}`,
    );
    socket.disconnect();
    return;
  }

  // Event: User join a specific room
  socket.on("room:join", (roomId: string) => {
    const participants = roomId.split("_");
    if (!participants.includes(String(userId))) {
      socket.emit("error:occurred", { message: "Unauthorized room join attempt." });
      logger.error(`[MESSAGE SOCKET] User ${userId} blocked from joining Room: ${roomId}`);
      return;
    }

    socket.join(roomId);
    logger.debug(`[MESSAGE SOCKET] user ${userId} joined room ${roomId}`);
  });

  // Event: Send a new encrypted message in real time
  socket.on("message:send", async (payload: SendMessagePayload, callback?: Function) => {
    try {
      const createMessage = await messageService.createMessage({
        senderId: userId,
        receiverId: payload.receiverId,
        message: payload.message,
        replyToId: payload.replyToId,
        forwardFromId: payload.forwardFromId,
      });

      const chatRoomId = createMessage.roomId;

      socket.to(chatRoomId).emit("message:received", createMessage);

      if (callback) {
        callback({ success: true, data: createMessage });
      }
    } catch (error: any) {
      logger.error(`[MESSAGE SOCKET] Send message error, User ${userId}: ${error.message}`);
      socket.emit("error:occurred", { message: error.message || "failed to send message" });
    }
  });

  // Event: Edit a message content in real time
  socket.on("message:edit", async (payload: EditMessagePayload, callback?: Function) => {
    try {
      const updatedMessage = await messageService.editMessageContent(
        userId,
        payload.messageId,
        payload.newMessage,
      );

      socket.to(updatedMessage.roomId).emit("message:edited", {
        messageId: updatedMessage.id,
        roomId: updatedMessage.roomId,
        isEdited: true,
      });

      if (callback) {
        callback({ success: true });
      }
    } catch (error: any) {
      logger.error(`[MESSAGE SOCKET] Edit error, User ${userId}: ${error.message}`);
      socket.emit("error:occured", { message: error.message || "Failed to edit message" });
    }
  });

  // Event: Recall message / delete message for everyone
  socket.on("message:recall", async (payload: DeleteMessagePayload, callback?: Function) => {
    try {
      const recalledMessage = await messageService.deleteMessageForEveryone(
        userId,
        payload.messageId,
      );

      io.to(recalledMessage.roomId).emit("message:recalled", {
        messageId: recalledMessage.id,
        roomId: recalledMessage.roomId,
      });

      if (callback) callback({ success: true });
    } catch (error: any) {
      logger.error(`[MESSAGE SOCKET] Recall error, User ${userId}: ${error.message}`);
      socket.emit("error:occured", { message: error.message || "Failed to recall message" });
    }
  });

  // Event: Connection disconnection (User Offline)
  socket.on("disconnect", () => [
    logger.info(`[MESSAGE SOCKET] Client disconected gracefully: ${socket.id} (User: ${userId})`),
  ]);
};
