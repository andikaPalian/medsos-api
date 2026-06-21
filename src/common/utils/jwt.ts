import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";

export interface TokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  username?: string;
}

if (!process.env.JWT_SECRET || !process.env.JWT_SECRET_REFRESH) {
  throw new Error("JWT_SECRET or JWT_SECRET_REFRESH is not defined.");
}

const JWT_SECRET: Secret = env.JWT_SECRET;
const JWT_SECRET_REFRESH: Secret = env.JWT_SECRET_REFRESH;

// Generate a JWT access token
export const generateAccessToken = (userId: string, username: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    subject: userId,
  };
  return jwt.sign({ username }, JWT_SECRET, options);
};

// Generate a JWT refresh token
export const generateRefreshToken = (userId: string, jti: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    subject: userId,
    jwtid: jti,
  };
  return jwt.sign({}, JWT_SECRET_REFRESH, options);
};

// Calculating the refresh token expiration date
export const getRefreshTokenExpiry = (): Date => {
  const expiresEnv = process.env.JWT_REFRESH_EXPIRES || "7d";
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
export const verifyToken = (token: string, secret: Secret = JWT_SECRET): Promise<TokenPayload> => {
  return new Promise((resolve, reject) => {
    // Run verification token in thread pool
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      if (!decoded) return reject(new Error("Unauthorized: Token payload is empty"));
      resolve(decoded as TokenPayload);
    });
  });
};

export const verifyTokenIgnoreExpiry = (
  token: string,
  secret: Secret = JWT_SECRET_REFRESH,
): Promise<TokenPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, { ignoreExpiration: true }, (err, decoded) => {
      if (err) return reject(err);
      if (!decoded) return reject(new Error("Unauthorized: Token payload is empty"));
      resolve(decoded as TokenPayload);
    });
  });
};
