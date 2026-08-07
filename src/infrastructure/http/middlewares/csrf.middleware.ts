import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "@core/errors/index.js";
import { env } from "@core/config/env.config.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;
  const customHeader = req.headers["x-requested-with"] || req.headers["x-csrf-token"];

  if (origin) {
    try {
      const allowedClientOrigin = new URL(env.CLIENT_URL).origin;
      const allowedBackendOrigin = new URL(env.BACKEND_URL).origin;
      const requestOrigin = new URL(origin).origin;

      if (requestOrigin !== allowedClientOrigin && requestOrigin !== allowedBackendOrigin) {
        throw new ForbiddenError("CSRF verification failed: Invalid origin");
      }
    } catch (error) {
      if (error instanceof ForbiddenError) throw error;
      throw new ForbiddenError("CSRF verification failed: Malformed origin header");
    }
  }

  if (!customHeader && !req.headers.authorization) {
    if (req.cookies && (req.cookies.accessToken || req.cookies.refreshToken)) {
      throw new ForbiddenError("CSRF verification failed: Missing anti-CSRF header (X-Requested-With or X-CSRF-Token)");
    }
  }

  next();
};
