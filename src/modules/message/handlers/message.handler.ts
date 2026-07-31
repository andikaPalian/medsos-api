import { AppServer, AppSocket } from "../../../common/types/socket.types.js";
import { socketHandler } from "../../../common/utils/socketHandlers.js";
import * as messageService from "../services/messages.service.js";
import * as messageRepository from "../repositories/message.repository.js";

export const registerMessageHandlers = (io: AppServer, socket: AppSocket): void => {
  const userId = socket.data.userId;

  socket.on("room:join", async ({ roomId }) => {
    const participants = await messageRepository.findRoomParticipantIds(roomId);
    if (!participants.includes(userId)) {
      socket.emit("error", { message: "Unauthorized: not a participant of this room" });
      return;
    }
    socket.join(`room:${roomId}`);
  });

  socket.on("typing:start", ({ roomId }) => {
    socket.to(`room:${roomId}`).emit("typing:start", { userId, roomId });
  });

  socket.on("typing:stop", ({ roomId }) => {
    socket.to(`room:${roomId}`).emit("typing:stop", { userId, roomId });
  });

  socket.on(
    "message:markRead",
    socketHandler(socket, async ({ messageId }) => {
      const message = await messageService.markMessageAsRead(userId, messageId);
      if (!message) return;

      io.to(`user:${message.senderId}`).emit("message:read", { messageId, readBy: userId });
    }),
  );

  socket.on(
    "room:markRead",
    socketHandler(socket, async ({ roomId }) => {
      const affectCount = await messageService.markMessageRoomAsRead(userId, roomId);
      if (affectCount === 0) return;

      io.to(`room:${roomId}`).emit("room:readAll", { roomId, readBy: userId });
    }),
  );
};
