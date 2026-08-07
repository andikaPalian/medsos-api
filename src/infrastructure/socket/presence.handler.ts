import { AppServer, AppSocket } from "@core/types/socket.types.js";
import { addPresence, removePresence } from "./socket.presence.js";
import { messageRepository } from "@modules/message/message.repository.js";
import { logger } from "@core/utils/logger.js";

export const registerPresenceHandlers = (io: AppServer, socket: AppSocket): void => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);

  addPresence(userId, socket.id).then(async (becameOnline) => {
    if (becameOnline) {
      logger.info(`[PRESENCE] User ${userId} is now ONLINE`);
      const coParticipants = await messageRepository.findCoParticipantIds(userId);
      coParticipants.forEach((coUserId) => {
        io.to(`user:${coUserId}`).emit("presence:online", { userId });
      });
    }
  });

  socket.on("disconnect", () => {
    removePresence(userId, socket.id).then(async (becameOffline) => {
      if (becameOffline) {
        logger.info(`[PRESENCE] User ${userId} is now OFFLINE`);
        const coParticipants = await messageRepository.findCoParticipantIds(userId);
        coParticipants.forEach((coUserId) => {
          io.to(`user:${coUserId}`).emit("presence:offline", { userId });
        });
      }
    });
  });
};
