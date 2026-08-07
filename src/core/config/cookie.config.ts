import { CookieOptions } from "express";
import { env } from "./env.config.js";
import { COOKIE } from "@core/constants/app.constants.js";

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
};

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN_MS: COOKIE.ACCESS_TOKEN_MS,
  REFRESH_TOKEN_MS: COOKIE.REFRESH_TOKEN_MS,
} as const;
