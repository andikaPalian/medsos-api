import { logger } from "../../../common/utils/logger.js";
import { uploadToCloudinary } from "../../../common/utils/uploadToCloudinary.js";
import { cloudinary } from "../../../config/cloudinary.js";
import { UploadMediaDTO } from "../dto/media-response.dto.js";

export const uploadProfilePicture = async (file: Express.Multer.File): Promise<UploadMediaDTO> => {
  return await uploadToCloudinary(file, "media-social/profile-pictures");
};

export const deleteAssets = (publicId: string): void => {
  cloudinary.uploader
    .destroy(publicId)
    .then(() => logger.info(`[MEDIA SERVICE] Assets destroyed: ${publicId}`))
    .catch((err: Error) =>
      logger.error(`[MEDIA SERVICE] Failed to destroy: ${publicId}. Error: ${err.message}`),
    );
};
