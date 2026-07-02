import { Request, Response, NextFunction } from "express";
import { AppError } from "../common/error/errorHandler.js";
import { TokenPayload, verifyToken } from "../common/utils/jwt.js";

// interface UserSession {
//   id: string;
//   username: string;
// }

export const userAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Authentication failed. Access token is missing. Please login.", 401));
  }

  try {
    const decoded = (await verifyToken(token)) as TokenPayload;

    req.user = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch (error) {
    const isTokenExpired = error instanceof Error && error.name === "TokenExpiredError";
    const errorMessage = isTokenExpired
      ? "Unauthorized: Token expired."
      : "Unauthorized: Invalid Token.";

    next(new AppError(errorMessage, 401));
  }
};
