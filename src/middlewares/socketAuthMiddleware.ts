import { Socket } from "socket.io";
import { SocketData } from "../common/types/socket.types.js";
import { verifyToken } from "../common/utils/jwt.js";
import { logger } from "../common/utils/logger.js";

const getCookieValue = (cookieString: string | undefined, cookieName: string): string | null => {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(^|; )${cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
};

export const socketAuth = async (
  socket: Socket<any, any, any, SocketData>,
  next: (err?: Error) => void,
): Promise<void> => {
  const cookieHeader = socket.handshake.headers?.cookie;

  let token = socket.handshake.auth?.token || getCookieValue(cookieHeader, "accessToken");
  if (!token && socket.handshake.headers?.authorization?.startsWith("Bearer ")) {
    token = socket.handshake.headers.authorization.split(" ")[1];
  }
  if (!token) {
    const error = new Error("Authentication failed. Access token is missing.") as any;
    error.data = { code: "TOKEN_MISSING" };
    return next(error);
  }

  try {
    const decoded = await verifyToken(token);

    socket.data.user = {
      userId: String(decoded.sub || decoded.id),
      username: decoded.username || "",
    };

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
