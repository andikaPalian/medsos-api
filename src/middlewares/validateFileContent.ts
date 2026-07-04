import { Request, Response, NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";
import { logger } from "../common/utils/logger.js";
import { AppError } from "../common/error/errorHandler.js";

export const validateFileContent = (allowedMimeType: Set<string>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      next();
      return;
    }

    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected || !allowedMimeType.has(detected.mime)) {
      logger.warn(
        `[UPLOAD] Content mismatch. Claimed: ${req.file.mimetype}, Actual: ${detected?.mime ?? "unknown"}`,
      );
      next(new AppError("File content does not match its claimed type", 400));
      return;
    }

    next();
  };
};
