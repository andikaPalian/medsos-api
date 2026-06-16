import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env..js";

if (!process.env.JWT_SECRET || !process.env.JWT_SECRET_REFRESH) {
  throw new Error("JWT_SECRET or JWT_SECRET_REFRESH is not defined.");
}

const JWT_SECRET: Secret = process.env.JWT_SECRET as string;
const JWT_SECRET_REFRESH: Secret = process.env.JWT_SECRET_REFRESH as string;

// Generate a JWT access token
export const generateAccessToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  };
  return jwt.sign({ id: userId }, JWT_SECRET, options);
};

// Generate a JWT refresh token
export const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  };
  return jwt.sign({ id: userId }, JWT_SECRET_REFRESH, options);
};

// Calculating the refresh token expiration date
export const getRefreshTokenExpiry = (): Date => {
  const expiresEnv = process.env.JWT_REFRESH_EXPIRES || "7";
  const days = parseInt(expiresEnv, 10);
  const dayInMs = (isNaN(days) ? 7 : days) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + dayInMs);
};

// OAuth registration token
export const generateRegisterToken = (payload: Record<string, unknown>): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REGISTER_EXPIRES,
  };
  return jwt.sign({ ...payload, type: "oauth_registration" }, JWT_SECRET, options);
};

// Verify a JWT token
export const verifyToken = (token: string, secret: Secret = JWT_SECRET): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    // Run verification token in thread pool
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      if (!decoded) return reject(new Error("Unauthorized: Token payload is empty"));
      resolve(decoded as JwtPayload);
    });
  });
};

// Hash refresh token
export const hashRefreshToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
