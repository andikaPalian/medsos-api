import { AppServer, AppSocket } from "@core/types/socket.types.js";
import { ForbiddenError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { messageService as defaultMessageService } from "./message.service.js";
import { messageRepository as defaultMessageRepo } from "./message.repository.js";

const socketWrapper = <T>(
  socket: AppSocket,
  fn: (payload: T) => Promise<void>,
) => {
  return async (payload: T): Promise<void> => {
    try {
      await fn(payload);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode;
        socket.emit("error", { message: error.message, statusCode });
      } else {
        logger.error(`[SOCKET HANDLER] Unhandled error: ${String(error)}`);
        socket.emit("error", { message: "Something went wrong" });
      }
    }
  };
};

export const registerMessageHandlers = (
  io: AppServer,
  socket: AppSocket,
  messageService = defaultMessageService,
  messageRepo = defaultMessageRepo,
): void => {
  const userId = socket.data.userId;

  socket.on(
    "room:join",
    socketWrapper(socket, async ({ roomId }) => {
      const participants = await messageRepo.findRoomParticipantIds(roomId);
      if (!participants.includes(userId)) {
        socket.emit("error", { message: "Unauthorized: not a participant of this room" });
        return;
      }
      socket.join(`room:${roomId}`);
    }),
  );

  socket.on(
    "typing:start",
    socketWrapper(socket, async ({ roomId }) => {
      const isRoomParticipant = socket.rooms.has(`room:${roomId}`);
      if (!isRoomParticipant) {
        throw new ForbiddenError("Unauthorized: not a participant of this room");
      }
      socket.to(`room:${roomId}`).emit("typing:start", { userId, roomId });
    }),
  );

  socket.on(
    "typing:stop",
    socketWrapper(socket, async ({ roomId }) => {
      const isRoomParticipant = socket.rooms.has(`room:${roomId}`);
      if (!isRoomParticipant) {
        throw new ForbiddenError("Unauthorized: not a participant of this room");
      }
      socket.to(`room:${roomId}`).emit("typing:stop", { userId, roomId });
    }),
  );

  socket.on(
    "message:markRead",
    socketWrapper(socket, async ({ messageId }) => {
      const message = await messageService.markMessageAsRead(userId, messageId);
      if (!message) return;
      io.to(`user:${message.senderId}`).emit("message:read", { messageId, readBy: userId });
    }),
  );

  socket.on(
    "room:markRead",
    socketWrapper(socket, async ({ roomId }) => {
      const affectedCount = await messageService.markMessageRoomAsRead(userId, roomId);
      if (affectedCount === 0) return;
      io.to(`room:${roomId}`).emit("room:readAll", { roomId, readBy: userId });
    }),
  );
};
