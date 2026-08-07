import { AppServer } from "@core/types/socket.types.js";
import { logger } from "@core/utils/logger.js";
import { socketAuth } from "./socket.middleware.js";
import { registerPresenceHandlers } from "./presence.handler.js";

export const registerSocketServer = (
  io: AppServer,
  moduleSocketRegisterers: Array<(io: AppServer, socket: unknown) => void> = [],
): void => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    logger.info(`[SOCKET] Connected: ${socket.id} (user: ${socket.data.userId})`);

    registerPresenceHandlers(io, socket);

    for (const registerer of moduleSocketRegisterers) {
      registerer(io, socket);
    }
  });
};
