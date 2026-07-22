import { Request, Response, NextFunction } from "express";
import { UPLOAD_CONFIG } from "./multer.js";
import { AppError } from "../common/error/errorHandler.js";

export const validatePostMediaSize = (req: Request, _res: Response, next: NextFunction): void => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files) {
    next();
    return;
  }

  for (const file of files) {
    const isImage = file.mimetype.startsWith("image/");
    const maxSize = isImage ? UPLOAD_CONFIG.IMAGE.MAX_SIZE : UPLOAD_CONFIG.VIDEO.MAX_SIZE;

    if (file.size > maxSize) {
      next(
        new AppError(
          `File "${file.originalname}" exceeds the ${isImage ? "5MB image" : "50MB video"} limit.`,
          400,
        ),
      );
      return;
    }
  }
  next();
};
