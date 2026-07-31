import { AppServer } from "../common/types/socket.types.js";

let ioInstance: AppServer | null = null;

export const setSocketServer = (io: AppServer): void => {
  ioInstance = io;
};

export const getSocketServer = (): AppServer => {
  if (!ioInstance) throw new Error("Socket server has not been initialized yet.");
  return ioInstance;
};
