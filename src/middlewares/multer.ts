import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { logger } from "../common/utils/logger.js";
import { AppError } from "../common/error/errorHandler.js";

export const UPLOAD_CONFIG = {
  IMAGE: {
    MAX_SIZE: 1024 * 1024 * 5, // 5MB
    MIME_TYPES: new Set(["image/png", "image/jpeg"]),
  },
  VIDEO: {
    MAX_SIZE: 1024 * 1024 * 50, // 50MB,
    MIME_TYPES: new Set(["video/mp4", "video/mkv", "video/avi", "video/webm"]),
  },
} as const;

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  if (UPLOAD_CONFIG.IMAGE.MIME_TYPES.has(file.mimetype)) {
    callback(null, true);
  } else {
    logger.warn(`[MULTER] Blocked invalid file. File: ${file.originalname} (${file.mimetype})`);
    callback(
      new AppError("Invalid file type. Only PNG, and JPEG files are allowed for images.", 400),
    );
  }
};

const videoFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  if (UPLOAD_CONFIG.VIDEO.MIME_TYPES.has(file.mimetype)) {
    callback(null, true);
  } else {
    logger.warn(`[MULTER] Blocked invalid file. File: ${file.originalname} (${file.mimetype})`);
    callback(
      new AppError(
        "Invalid file type. Only MP4, MKV, AVI, and WEBM files are allowed for videos.",
        400,
      ),
    );
  }
};

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.IMAGE.MAX_SIZE,
  },
});

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  fileFilter: videoFileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.VIDEO.MAX_SIZE,
  },
});
