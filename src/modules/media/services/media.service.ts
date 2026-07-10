import { logger } from "../../../common/utils/logger.js";
import {
  uploadAttachmentToCloudinary,
  uploadToCloudinary,
} from "../../../common/utils/uploadToCloudinary.js";
import { cloudinary } from "../../../config/cloudinary.js";
import { UploadAttachmentDTO, UploadMediaDTO } from "../dto/media-response.dto.js";

export const uploadProfilePicture = async (file: Express.Multer.File): Promise<UploadMediaDTO> => {
  return await uploadToCloudinary(file, "media-social/profile-pictures");
};

export const uploadMessageAttachment = async (
  buffer: Buffer,
  originalFileName: string,
): Promise<UploadAttachmentDTO> => {
  return await uploadAttachmentToCloudinary(buffer, originalFileName);
};

export const deleteAssets = (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): void => {
  cloudinary.uploader
    .destroy(publicId, { resource_type: resourceType })
    .then(() => logger.info(`[MEDIA SERVICE] Assets destroyed: ${publicId}`))
    .catch((err: Error) =>
      logger.error(`[MEDIA SERVICE] Failed to destroy: ${publicId}. Error: ${err.message}`),
    );
};
