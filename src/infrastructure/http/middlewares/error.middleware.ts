import { Request, Response, NextFunction } from "express";
import { AppError } from "@core/errors/base.error.js";
import { ValidationError } from "@core/errors/validation.error.js";
import { env } from "@core/config/env.config.js";
import { logger } from "@core/utils/logger.js";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: err.code,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: err.code,
      message: err.message,
    });
    return;
  }

  logger.error(`[UNHANDLED ERROR] ${err.stack || err.message}`);

  res.status(500).json({
    success: false,
    statusCode: 500,
    error: "INTERNAL_SERVER_ERROR",
    message: env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};
