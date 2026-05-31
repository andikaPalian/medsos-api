export const COOKIES_OPTIONS = {
  // Protection against XSS attacks
  httpOnly: true,
  // Must https on production
  secure: process.env.NODE_ENV === "production",
  // Protection against CSRF attacks
  sameSite: "lax",
  // Cookie expiration time (1 day)
  // maxAge: 24 * 60 * 60 * 1000,
};
