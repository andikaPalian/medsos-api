import { Response } from "express";
import { COOKIE_OPTIONS, TOKEN_EXPIRY } from "@core/config/cookie.config.js";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie("accessToken", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN_MS,
  });

  res.cookie("refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_MS,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", COOKIE_OPTIONS);
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
};
