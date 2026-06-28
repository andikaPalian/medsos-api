import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ValidationError } from "../common/error/validationError.js";
import { AppError } from "../common/error/errorHandler.js";
import { logger } from "../common/utils/logger.js";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isProduction = process.env.NODE_ENV === "production";

  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  logger.error(`[SERVER ERROR] ${err.stack || err.message}`);
  res.status(err.statusCode || 500).json({
    success: false,
    message: isProduction ? "Internal server error" : err.message,
    ...(isProduction && { stack: err.stack }),
  });
};
