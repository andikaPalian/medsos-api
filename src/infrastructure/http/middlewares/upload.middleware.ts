import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { logger } from "@core/utils/logger.js";
import { BadRequestError } from "@core/errors/index.js";
import { UPLOAD } from "@core/constants/app.constants.js";

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  if (UPLOAD.IMAGE.MIME_TYPES.has(file.mimetype)) {
    callback(null, true);
  } else {
    logger.warn(`[MULTER] Blocked invalid file: ${file.originalname} (${file.mimetype})`);
    callback(new BadRequestError("Invalid file type. Only PNG and JPEG files are allowed for images."));
  }
};

const videoFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  if (UPLOAD.VIDEO.MIME_TYPES.has(file.mimetype)) {
    callback(null, true);
  } else {
    logger.warn(`[MULTER] Blocked invalid file: ${file.originalname} (${file.mimetype})`);
    callback(new BadRequestError("Invalid file type. Only MP4, MKV, AVI, and WEBM files are allowed for videos."));
  }
};

const combinedFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  const isValidImage = UPLOAD.IMAGE.MIME_TYPES.has(file.mimetype);
  const isValidVideo = UPLOAD.VIDEO.MIME_TYPES.has(file.mimetype);

  if (isValidImage || isValidVideo) {
    callback(null, true);
  } else {
    logger.warn(`[MULTER] Blocked invalid file: ${file.originalname} (${file.mimetype})`);
    callback(new BadRequestError("Invalid file type. Only PNG, JPEG, MP4, MKV, AVI, and WEBM files are allowed."));
  }
};

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: UPLOAD.IMAGE.MAX_SIZE },
});

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  fileFilter: videoFileFilter,
  limits: { fileSize: UPLOAD.VIDEO.MAX_SIZE },
});

export const uploadMedia = multer({
  storage: multer.memoryStorage(),
  fileFilter: combinedFileFilter,
  limits: {
    fileSize: UPLOAD.VIDEO.MAX_SIZE,
    files: UPLOAD.MAX_FILES,
  },
});
