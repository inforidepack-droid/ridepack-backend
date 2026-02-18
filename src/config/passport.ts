import User from "@/modules/auth/models/User.model";
import passport from "passport";

import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { logger } from "./logger";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(new Error("Google account has no email"), false);
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email,
            avatar: profile.photos?.[0].value,
          });

          logger.info(`New google user created ${email}`);
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Google auth eror ${error}`);
        return done(error as Error, false);
      }
    }
  )
);
