import path from "path";
import crypto from "crypto";
import { cloudinary } from "../../config/cloudinary.js";
import { logger } from "./logger.js";
import { AppError } from "../error/errorHandler.js";

interface CloudinaryMediaUploadResult {
  url: string;
  publicId: string;
  detectedResourceType: string;
}

interface CloudinaryAttachmentUploadResult {
  url: string;
  publicId: string;
}

const DEFAULT_FOLDERS = {
  image: "media-social/images",
  video: "media-social/videos",
  attachment: "media-social/attachments",
  other: "media-social/others",
} as const;

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder?: string,
): Promise<CloudinaryMediaUploadResult> => {
  return new Promise((resolve, reject) => {
    let resolveFolder = folder;
    if (!resolveFolder) {
      if (file.mimetype.startsWith("image/")) {
        resolveFolder = DEFAULT_FOLDERS.image;
      } else if (file.mimetype.startsWith("video/")) {
        resolveFolder = DEFAULT_FOLDERS.video;
      } else {
        resolveFolder = DEFAULT_FOLDERS.other;
      }
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = crypto.randomUUID();
    const rawName = path.basename(file.originalname, ext);
    const safeName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const finalPublicId = safeName ? `${safeName}-${uniqueSuffix}` : uniqueSuffix;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: resolveFolder,
        public_id: finalPublicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error(`[CLOUDINARY] Error uploading file to Cloudinary: ${error.message}`);
          return reject(new AppError("Failed to upload asset to cloud storage", 500));
        }

        if (!result) {
          return reject(new AppError("Cloudinary returned empty result", 500));
        }

        logger.info(`[CLOUDINARY] Asset successfully uploaded to Cloudinary: ${result.secure_url}`);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          detectedResourceType: result.resource_type,
        });
      },
    );
    uploadStream.end(file.buffer);
  });
};

export const uploadAttachmentToCloudinary = async (
  buffer: Buffer,
  originalFileName: string,
): Promise<CloudinaryAttachmentUploadResult> => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalFileName).toLowerCase();
    const uniqueSuffix = crypto.randomUUID();
    const rawName = path.basename(originalFileName, ext);
    const safeName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const finalPublicId = `${safeName || "file"}-${uniqueSuffix}${ext}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: DEFAULT_FOLDERS.attachment,
        public_id: finalPublicId,
      },
      (error, result) => {
        if (error) {
          logger.error(`[CLOUDINARY] Error uploading attachment to Cloudinary: ${error.message}`);
          return reject(new AppError("Failed to upload attachment to cloud storage", 500));
        }

        if (!result) {
          return reject(new AppError("Cloudinary returned empty result", 500));
        }

        logger.info(
          `[CLOUDINARY] Attachment successfully uploaded to Cloudinary: ${result.secure_url}`,
        );

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    uploadStream.end(buffer);
  });
};
