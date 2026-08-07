import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@core/utils/jwt.util.js";
import { UnauthorizedError } from "@core/errors/index.js";

export const userAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new UnauthorizedError("Authentication token is missing");
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired authentication token");
  }
};
