import { AppServer } from "../common/types/socket.types.js";
import { logger } from "../common/utils/logger.js";
import { socketAuth } from "../middlewares/socketAuthMiddleware.js";
import { registerMessageHandlers } from "../modules/message/handlers/message.handler.js";
import { registerPresenceHandlers } from "./handlers/presence.socket.js";

export const registerSocketServer = (io: AppServer): void => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    logger.info(`[SOCKET] Connected: ${socket.id} (user: ${socket.data.userId})`);

    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);
  });
};
