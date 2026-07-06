import crypto from "crypto";
import { env } from "../../config/env.js";
import { logger } from "./logger.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const fileSecretKey = Buffer.from(env.FILE_ENCRYPTION_KEY, "hex");

interface FileEncryptionResult {
  iv: string;
  fileAuthTag: string;
  encryptedBuffer: Buffer;
}

export class FileEncryptionError extends Error {
  constructor(
    message = "Failed to encrypt file: data may be corrupted, tampered with, or encrypted with a different key.",
  ) {
    super(message);
    this.name = "FileEncryptionError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const encryptFile = (fileBuffer: Buffer): FileEncryptionResult => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, fileSecretKey, iv);

  const encryptedBuffer = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const fileAuthTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    fileAuthTag: fileAuthTag.toString("hex"),
    encryptedBuffer,
  };
};

export const decryptFile = (encryptedFile: Buffer, iv: string, fileAuthTag: string): Buffer => {
  try {
    const ivBuffer = Buffer.from(iv, "hex");
    const fileAuthTagBuffer = Buffer.from(fileAuthTag, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, fileSecretKey, ivBuffer);
    decipher.setAuthTag(fileAuthTagBuffer);

    return Buffer.concat([decipher.update(encryptedFile), decipher.final()]);
  } catch (error) {
    const err = error as Error;
    logger.error(`[CRYPTO] Failed to decrypt file: ${err.message}`);
    throw new FileEncryptionError();
  }
};
