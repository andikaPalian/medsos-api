import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import * as authService from "../modules/auth/services/userAuth.service.js";
import { logger } from "../common/utils/logger.js";
import { env } from "./env.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const result = await authService.processGoogleLogin(profile, "google");

        done(null, result);
      } catch (error) {
        const err = error as Error;
        logger.error(`[PASSPORT] Google OAuth error: ${err.message}`);
        done(error, undefined);
      }
    },
  ),
);

export default passport;
