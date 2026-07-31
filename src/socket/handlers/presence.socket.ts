import { markUserOffline, markUserOnline } from "../state/socket.presence.js";
import { AppServer, AppSocket } from "../../common/types/socket.types.js";
import { logger } from "../../common/utils/logger.js";
import * as messageRepository from "../../modules/message/repositories/message.repository.js";

export const registerPresenceHandlers = async (io: AppServer, socket: AppSocket): Promise<void> => {
  const userId = socket.data.userId;

  socket.join(`user:${userId}`);

  const justCameOnline = markUserOnline(userId, socket.id);
  if (justCameOnline) {
    const coParticipants = await messageRepository.findCoParticipantIds(userId);
    coParticipants.forEach((p) => {
      io.to(`user:${p}`).emit("presence:online", { userId });
    });
  }

  socket.on("disconnect", async () => {
    const justWentOffline = markUserOffline(userId, socket.id);
    if (justWentOffline) {
      const coParticipants = await messageRepository.findCoParticipantIds(userId);
      coParticipants.forEach((p) => {
        io.to(`user:${p}`).emit("presence:offline", { userId });
      });
    }
    logger.info(`[SOCKET] Disconnected: ${socket.id} (user: ${userId})`);
  });
};
