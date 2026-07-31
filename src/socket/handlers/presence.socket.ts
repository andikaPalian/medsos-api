import { markUserOffline, markUserOnline } from "../state/socket.presence.js";
import { AppServer, AppSocket } from "../../common/types/socket.types.js";
import { logger } from "../../common/utils/logger.js";

export const registerPresenceHandlers = (io: AppServer, socket: AppSocket): void => {
  const userId = socket.data.userId;

  socket.join(`user:${userId}`);

  const justCameOnline = markUserOnline(userId, socket.id);
  if (justCameOnline) {
    socket.broadcast.emit("presence:online", { userId });
  }

  socket.on("disconnect", () => {
    const justWentOffline = markUserOffline(userId, socket.id);
    if (justWentOffline) {
      socket.broadcast.emit("presence:offline", { userId });
    }
    logger.info(`[SOCKET] Disconnected: ${socket.id} (user: ${userId})`);
  });
};
