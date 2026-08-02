import { markUserOffline, markUserOnline } from "../state/socket.presence.js";
import { AppServer, AppSocket } from "../../common/types/socket.types.js";
import { logger } from "../../common/utils/logger.js";
import * as messageRepository from "../../modules/message/repositories/message.repository.js";

export const registerPresenceHandlers = (io: AppServer, socket: AppSocket): void => {
  const userId = socket.data.userId;

  socket.join(`user:${userId}`);

  markUserOnline(userId, socket.id)
    .then((justCameOnline) => {
      if (!justCameOnline) return;
      return messageRepository
        .findCoParticipantIds(userId)
        .then((coParticipants) =>
          coParticipants.forEach((p) => io.to(`user:${p}`).emit("presence:online", { userId })),
        );
    })
    .catch((error: Error) => {
      logger.error(`[SOCKET] Failed to process presence online: ${error.message}`);
    });

  socket.on("disconnect", () => {
    markUserOffline(userId, socket.id)
      .then((justWentOffline) => {
        if (!justWentOffline) return;
        return messageRepository.findCoParticipantIds(userId).then((coParticipants) => {
          coParticipants.forEach((p) => io.to(`user:${p}`).emit("presence:offline", { userId }));
        });
      })
      .catch((error: Error) => {
        logger.error(`[SOCKET] Failed to process presence offline: ${error.message}`);
      });
    logger.info(`[SOCKET] Disconnected: ${socket.id} (user: ${userId})`);
  });
};
