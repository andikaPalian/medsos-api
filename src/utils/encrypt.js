import crypto from "crypto";
import { de } from "zod/locales";

// Using the AES (Advanced Encryption Standard) algorithm with a key length of 256 bits and CBC (Cipher Block Chaining) operating mode.
const algorithm = "aes-256-cbc";
const secret_key = Buffer.from(process.env.SECRET_KEY, "hex");

export const encryptMessage = (message) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secret_key, iv);
    let encrypted = cipher.update(message, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return {
        iv: iv.toString("hex"),
        encryptedMessage: encrypted
    };
};

export const decryptMessage = (encryptMessage, iv) => {
    try {
        const ivBuffer = Buffer.from(iv, "hex");
        const dechiper = crypto.createDecipheriv(algorithm, secret_key, ivBuffer);
        let decrypted = dechiper.update(encryptMessage, "hex", "utf-8");;
        decrypted += dechiper.final("utf8");
        return decrypted;
    } catch (error) {
        console.error("Error decrypting message: ", error);
        return null;
    }
};