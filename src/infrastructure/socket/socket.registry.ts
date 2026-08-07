import { AppServer } from "@core/types/socket.types.js";
import { InternalServerError } from "@core/errors/index.js";

let ioInstance: AppServer | null = null;

export const setSocketServer = (io: AppServer): void => {
  ioInstance = io;
};

export const getSocketServer = (): AppServer => {
  if (!ioInstance) {
    throw new InternalServerError("Socket.io server instance has not been initialized");
  }
  return ioInstance;
};
