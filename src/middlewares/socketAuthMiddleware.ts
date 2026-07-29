import * as cookie from "cookie";
import { AppSocket } from "../common/types/socket.types.js";
import { AccessTokenPayload, verifyToken } from "../common/utils/jwt.js";
import { logger } from "../common/utils/logger.js";

export const socketAuth = async (socket: AppSocket, next: (err?: Error) => void): Promise<void> => {
  try {
    let token = socket.handshake.auth?.token as string | undefined;

    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parseCookie(socket.handshake.headers.cookie);
      token = cookies["accessToken"];
    }

    if (!token && socket.handshake.headers.authorization?.startsWith("Bearer ")) {
      token = socket.handshake.headers.authorization.split(" ")[1];
    }
    if (!token) {
      const error = new Error("Authentication failed. Access token is missing.") as any;
      error.data = { code: "TOKEN_MISSING" };
      return next(error);
    }

    const decoded = await verifyToken<AccessTokenPayload>(token);

    socket.data.userId = decoded.sub;
    socket.data.username = decoded.username;

    next();
  } catch (error: any) {
    const err = new Error("Authentication failed: Access token execution failed") as any;

    if (error.name === "TokenExpiredError") {
      err.message = "Unauthorized: Access token expired.";
      err.data = { code: "TOKEN_EXPIRED" };
      logger.warn(
        `[SOCKET AUTH] Connection rejected: Token expired from IP ${socket.handshake.address}`,
      );
    } else {
      err.message = "Unauthorized: Invalid access token.";
      err.data = { code: "TOKEN_INVALID" };
      logger.warn(`[SOCKET AUTH] Alert: Invalid token attempt from IP ${socket.handshake.address}`);
    }
    return next(err);
  }
};
