// ============================================================
// Encryption utilities for text messages and files
// Uses AES-256-GCM for authenticated encryption
// ============================================================

import crypto from "crypto";
import { env } from "@core/config/env.config.js";
import { logger } from "./logger.js";
import { MessageDecryptionError, FileDecryptionError } from "@core/errors/index.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// ── Text Encryption (Messages) ──

const messageSecretKey = Buffer.from(env.MESSAGE_ENCRYPTION_KEY, "hex");

export interface TextEncryptionResult {
  iv: string;
  authTag: string;
  encryptedMessage: string;
}

export const encryptMessage = (message: string): TextEncryptionResult => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, messageSecretKey, iv);

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

    const decipher = crypto.createDecipheriv(ALGORITHM, messageSecretKey, ivBuffer);
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

// ── File Encryption (Attachments) ──

const fileSecretKey = Buffer.from(env.FILE_ENCRYPTION_KEY, "hex");

export interface FileEncryptionResult {
  iv: string;
  fileAuthTag: string;
  encryptedBuffer: Buffer;
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
    throw new FileDecryptionError();
  }
};
