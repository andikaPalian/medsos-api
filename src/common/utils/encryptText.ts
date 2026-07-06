import crypto from "crypto";
import { env } from "../../config/env.js";
import { logger } from "./logger.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const secretKey = Buffer.from(env.MESSAGE_ENCRYPTION_KEY, "hex");

interface EncryptionResult {
  iv: string;
  authTag: string;
  encryptedMessage: string;
}

export class MessageDecryptionError extends Error {
  constructor(
    message = "Failed to decrypt message: data may be corrupted, tampared with, or encrypted with a different key.",
  ) {
    super(message);
    this.name = "MessageDecryptionError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const encryptMessage = (message: string): EncryptionResult => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);

  let encrypted = cipher.update(message, "utf-8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    encryptedMessage: encrypted,
  };
};

export const decryptMessage = (
  encryptedMessage: string | null,
  iv: string | null,
  authTag: string | null,
): string | null => {
  if (!encryptedMessage || !iv || !authTag) return null;

  try {
    const ivBuffer = Buffer.from(iv, "hex");
    const authTagBuffer = Buffer.from(authTag, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encryptedMessage, "hex", "utf-8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    const err = error as Error;
    logger.error(`[CRYPTO] Failed to decrypt message: ${err.message}`);
    throw new MessageDecryptionError();
  }
};
