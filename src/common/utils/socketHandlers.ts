import { AppError } from "../error/errorHandler.js";
import { AppSocket } from "../types/socket.types.js";
import { logger } from "./logger.js";

export const socketHandler = <T>(socket: AppSocket, fn: (payload: T) => Promise<void>) => {
  return async (payload: T): Promise<void> => {
    try {
      await fn(payload);
    } catch (error) {
      if (error instanceof AppError) {
        socket.emit("error", { message: error.message, statusCode: error.statusCode });
      } else {
        logger.error(`[SOCKET HANDLER] Unhandled error: ${(error as Error).message}`);
        socket.emit("error", { message: "Something went wrong" });
      }
    }
  };
};
