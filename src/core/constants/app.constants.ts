export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const AUTH = {
  BCRYPT_ROUNDS: 12,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINS: 5,
  RESET_TOKEN_EXPIRY_MINS: 30,
  MAX_SESSIONS_PER_USER: 10,
} as const;

export const MESSAGE = {
  RECALL_WINDOW_HOURS: 24,
  DEFAULT_LIMIT: 30,
  MAX_LIMIT: 50,
} as const;

export const UPLOAD = {
  IMAGE: {
    MAX_SIZE: 1024 * 1024 * 5,
    MIME_TYPES: new Set(["image/png", "image/jpeg"]),
  },
  VIDEO: {
    MAX_SIZE: 1024 * 1024 * 50,
    MIME_TYPES: new Set(["video/mp4", "video/mkv", "video/avi", "video/webm"]),
  },
  MAX_FILES: 10,
} as const;

export const STORY = {
  EXPIRY_HOURS: 24,
} as const;

export const FEED = {
  FOLLOWING_FETCH_LIMIT: 10000,
} as const;

export const COOKIE = {
  ACCESS_TOKEN_MS: 15 * 60 * 1000,
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000,
} as const;

export const CLOUDINARY_FOLDERS = {
  IMAGE: "media-social/images",
  VIDEO: "media-social/videos",
  ATTACHMENT: "media-social/attachments",
  OTHER: "media-social/others",
} as const;

export const REDIS = {
  RATE_LIMIT_PREFIX: "rl:",
  PRESENCE_PREFIX: "presence:",
} as const;

export const RATE_LIMIT = {
  AUTH_LIMIT_WINDOW_MINS: 15,
  AUTH_LIMIT_MAX_ATTEMPTS: 10,
  EMAIL_LIMIT_WINDOW_MINS: 5,
  EMAIL_LIMIT_MAX_ATTEMPTS: 3,
  GLOBAL_LIMIT_WINDOW_MINS: 1,
  GLOBAL_LIMIT_MAX_ATTEMPTS: 100,
} as const;

export const API_PREFIX = "/api/v1" as const;
