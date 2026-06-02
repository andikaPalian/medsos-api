import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generate a JWT access token
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
  });
};

// Generate a JWT refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET_REFRESH, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });
};

// Calculating the refresh token expiration date
export const getRefreshTokenExpiry = () => {
  const dayInMs = parseInt(process.env.JWT_REFRESH_EXPIRES) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + dayInMs);
};

// OAuth registration token
export const generateRegisterToken = (payload) => {
  return jwt.sign({ ...payload, type: "oauth_registration" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REGISTER_EXPIRES,
  });
};

// Verify a JWT token
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return new Promise((resolve, reject) => {
    if (!secret) {
      return reject(new Error("JWT Configuration Error: Secret key is missing."));
    }

    // Run verification token in thread pool
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

// Hash refresh token
export const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
