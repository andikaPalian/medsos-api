// ============================================================
// Cloudinary upload/delete helpers
// ============================================================

import path from "path";
import crypto from "crypto";
import { cloudinary } from "@core/config/cloudinary.config.js";
import { logger } from "./logger.js";
import { InternalServerError } from "@core/errors/index.js";
import { CLOUDINARY_FOLDERS } from "@core/constants/app.constants.js";

// ── Types ──

export interface CloudinaryMediaUploadResult {
  url: string;
  publicId: string;
  detectedResourceType: string;
}

export interface CloudinaryAttachmentUploadResult {
  url: string;
  publicId: string;
}

// ── Helpers ──

const generateSafePublicId = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueSuffix = crypto.randomUUID();
  const rawName = path.basename(originalName, ext);
  const safeName = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safeName ? `${safeName}-${uniqueSuffix}` : uniqueSuffix;
};

const resolveFolder = (mimetype: string): string => {
  if (mimetype.startsWith("image/")) return CLOUDINARY_FOLDERS.IMAGE;
  if (mimetype.startsWith("video/")) return CLOUDINARY_FOLDERS.VIDEO;
  return CLOUDINARY_FOLDERS.OTHER;
};

// ── Upload Functions ──

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder?: string,
): Promise<CloudinaryMediaUploadResult> => {
  return new Promise((resolve, reject) => {
    const targetFolder = folder ?? resolveFolder(file.mimetype);
    const finalPublicId = generateSafePublicId(file.originalname);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        public_id: finalPublicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error(`[CLOUDINARY] Upload error: ${error.message}`);
          return reject(new InternalServerError("Failed to upload asset to cloud storage"));
        }

        if (!result) {
          return reject(new InternalServerError("Cloudinary returned empty result"));
        }

        logger.info(`[CLOUDINARY] Uploaded: ${result.secure_url}`);

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
    const publicId = `${generateSafePublicId(originalFileName)}${ext}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: CLOUDINARY_FOLDERS.ATTACHMENT,
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          logger.error(`[CLOUDINARY] Attachment upload error: ${error.message}`);
          return reject(new InternalServerError("Failed to upload attachment to cloud storage"));
        }

        if (!result) {
          return reject(new InternalServerError("Cloudinary returned empty result"));
        }

        logger.info(`[CLOUDINARY] Attachment uploaded: ${result.secure_url}`);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    uploadStream.end(buffer);
  });
};

// ── Delete Function ──

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`[CLOUDINARY] Deleted: ${publicId}`);
  } catch (error) {
    const err = error as Error;
    logger.error(`[CLOUDINARY] Delete error for ${publicId}: ${err.message}`);
    // Non-critical — don't throw, just log
  }
};
