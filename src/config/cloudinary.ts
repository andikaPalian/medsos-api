import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";
import { logger } from "../common/utils/logger.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAMES,
  api_key: env.CLOUDINARY_API_KEYS,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const connectCloudinary = async (): Promise<void> => {
  try {
    await cloudinary.api.ping();
    logger.info("[CLOUDINARY] Connected to Cloudinary successfully.");
  } catch (error) {
    const err = error as Error;
    logger.error(`[CLOUDINARY] Failed to connect to Cloudinary: ${err.message}`);
    throw new Error(`Connection failed: ${err.message}`);
  }
};

export { cloudinary };
