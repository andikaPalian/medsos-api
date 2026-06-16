import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/errorHandler.js";
import { verifyToken } from "../utils/jwt.js";
import { UserSession } from "../types/auth/session.type.js";

export const userAuth = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("Authentication failed. Access token is missing. Please login.", 401),
      );
    }

    try {
      const decoded = (await verifyToken(token)) as unknown as UserSession;

      req.user = {
        id: decoded.id,
        username: decoded.username,
      };

      return next();
    } catch (error) {
      const isTokenExpired = error instanceof Error && error.name === "TokenExpiredError";
      const errorMessage = isTokenExpired
        ? "Unauthorized: Token expired."
        : "Unauthorized: Invalid Token.";

      return next(new AppError(errorMessage, 401));
    }
  },
);
