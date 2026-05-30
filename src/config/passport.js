import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as authService from "../api/v1/auth/userAuth.service.js";
import logger from "../utils/logger.js";

const BACKEND_URL = process.env.BACKEND_URL;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await authService.processGoogleLogin(profile, "google");

        return done(null, result);
      } catch (error) {
        logger.error(`[PASSPORT] Google OAuth error: ${error.message}`);
        return done(error, null);
      }
    },
  ),
);

export default passport;
