import { logger } from "@core/utils/logger.js";
import {
  uploadToCloudinary,
  uploadAttachmentToCloudinary,
  deleteFromCloudinary,
} from "@core/utils/cloudinary.util.js";
import {
  UploadAttachmentDTO,
  UploadMediaDTO,
  UploadPostMediaDTO,
} from "./dto/media-response.dto.js";

export const uploadProfilePicture = async (file: Express.Multer.File): Promise<UploadMediaDTO> => {
  return uploadToCloudinary(file, "media-social/profile-pictures");
};

export const uploadPostMedia = async (file: Express.Multer.File): Promise<UploadPostMediaDTO> => {
  return uploadToCloudinary(file, "media-social/posts");
};

export const uploadMessageAttachment = async (
  buffer: Buffer,
  originalFileName: string,
): Promise<UploadAttachmentDTO> => {
  return uploadAttachmentToCloudinary(buffer, originalFileName);
};

export const deleteAssets = (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): void => {
  deleteFromCloudinary(publicId, resourceType);
  logger.info(`[MEDIA SERVICE] Asset delete triggered for: ${publicId}`);
};
