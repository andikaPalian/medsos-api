import { AppSocket } from "@core/types/socket.types.js";
import { verifyAccessToken } from "@core/utils/jwt.util.js";
import { logger } from "@core/utils/logger.js";

const parseCookieHeader = (cookieHeader: string): Record<string, string> => {
  const list: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts.shift()?.trim();
      const val = parts.join("=").trim();
      if (name) list[name] = decodeURIComponent(val);
    }
  });
  return list;
};

export const socketAuth = (socket: AppSocket, next: (err?: Error) => void): void => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token && socket.handshake.headers.cookie) {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      logger.warn(`[SOCKET AUTH] Rejected connection ${socket.id}: Missing token`);
      return next(new Error("Authentication token missing"));
    }

    const decoded = verifyAccessToken(token);
    socket.data = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    const err = error as Error;
    logger.warn(`[SOCKET AUTH] Rejected connection ${socket.id}: ${err.message}`);
    next(new Error("Authentication failed: Invalid or expired token"));
  }
};
