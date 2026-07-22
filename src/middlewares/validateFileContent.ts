import { Request, Response, NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";
import { logger } from "../common/utils/logger.js";
import { AppError } from "../common/error/errorHandler.js";

const checkFileContent = async (
  file: Express.Multer.File,
  allowedMimeType: Set<string>,
): Promise<void> => {
  const detected = await fileTypeFromBuffer(file.buffer);

  if (!detected || !allowedMimeType.has(detected.mime)) {
    logger.warn(
      `[UPLOAD] Content mismatch. File: ${file.originalname}. Claimed: ${file.mimetype}, Actual: ${detected?.mime ?? "inknown"}`,
    );
    throw new AppError(`File "${file.originalname}" content does not match its claimed type`, 400);
  }
};

export const validateFileContent = (allowedMimeType: Set<string>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.file) {
      await checkFileContent(req.file, allowedMimeType);
      next();
      return;
    }

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        await checkFileContent(file, allowedMimeType);
      }
      next();
      return;
    }

    if (req.files && !Array.isArray(req.files)) {
      const allFiles = Object.values(req.files).flat();
      for (const file of allFiles) {
        await checkFileContent(file, allowedMimeType);
      }
      next();
      return;
    }

    next();
  };
};
