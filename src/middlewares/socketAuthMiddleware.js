import { verifyToken } from "../utils/jwt.js";
import logger from "../utils/logger.js";

// Helper function to extract cookie value without split-clashing risk
const getCookieValue = (cookieString, cookieName) => {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(^|; )${cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
};

export const socketAuth = async (socket, next) => {
  const cookieHeader = socket.handshake.headers?.cookie;
  const token = socket.handshake.auth?.token || getCookieValue(cookieHeader, "accessToken");

  if (!token) {
    const error = new Error("Authentication failed. Access token is missing.");
    error.data = { code: "TOKEN_MISSING" };
    return next(error);
  }

  try {
    const decoded = await verifyToken(token);
    socket.user = {
      id: String(decoded.id),
    };
    next();
  } catch (error) {
    const err = new Error("Authentication failed: Access token execution failed");

    if (error.name === "TokenExpiredError") {
      err.message = "Unauthorized: Access token expired";
      err.data = { code: "TOKEN_EXPIRED" };
      logger.warn(
        `[SOCKET AUTH] Connection rejected: Token expired from Ip ${socket.handshake.address}`,
      );
    } else {
      err.message = "Unauthorized: Connection rejected due to invalid token";
      err.data = { code: "TOKEN_INVALID" };
      logger.error(
        `[SOCKET AUTH] Security Alert: Invalid token attempt from IP ${socket.handshake.address}. Error: ${error.message}`,
      );
    }

    return next(err);
  }
};
