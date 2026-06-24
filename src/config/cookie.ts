import { CookieOptions } from "express";
import { env } from "../config/env.js";

export const COOKIES_OPTIONS: CookieOptions = {
  // Protection against XSS attacks
  httpOnly: true,
  // Must https on production
  secure: env.NODE_ENV === "production",
  // Protection against CSRF attacks
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  // Cookie expiration time (1 day)
  // maxAge: 24 * 60 * 60 * 1000,
};

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN_MS: 15 * 60 * 1000,
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000,
} as const;
