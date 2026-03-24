import { createError } from "@/utils/appError";
import { generateTokenWithExpiry, type TokenPayload } from "@/utils/token.util";
import { toGoogleAuthUserResponse } from "@/modules/auth/auth.utils";
import { verifyGoogleIdToken } from "@/modules/auth/googleAuth.helper";
import * as authRepository from "@/modules/auth/auth.repository";
import type { GoogleAuthResponse } from "@/modules/auth/auth.types";

const JWT_EXPIRY_DAYS = "7d";

export const googleLogin = async (idToken: string): Promise<GoogleAuthResponse> => {
  const payload = await verifyGoogleIdToken(idToken);
  const email = payload.email.trim().toLowerCase();
  const name = payload.name?.trim() ?? "";
  const picture = payload.picture?.trim() ?? "";
  const sub = payload.sub?.trim() ?? "";

  let user: Awaited<ReturnType<typeof authRepository.findUserByEmail>>;
  try {
    user = await authRepository.findUserByEmail(email);
  } catch {
    throw createError("Database error during user lookup", 500);
  }
  if (!user) {
    try {
      user = await authRepository.createUser({
        email,
        name: name || email,
        googleId: sub,
        profileImage: picture,
        role: "sender",
        authProvider: "google",
        isEmailVerified: true,
      });
    } catch (err: unknown) {
      const isDuplicate = err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000;
      if (isDuplicate) {
        throw createError("Duplicate email conflict", 409);
      }
      throw createError("Database error during user creation", 500);
    }
  } else {
    if (user.isBlocked) {
      throw createError("User account blocked", 403);
    }
    const updates: { googleId?: string; profileImage?: string; isEmailVerified?: boolean } = {};
    if (sub && !user.googleId) {
      updates.googleId = sub;
    }
    if (picture) {
      updates.profileImage = picture;
    }
    updates.isEmailVerified = true;
    if (Object.keys(updates).length > 0) {
      try {
        const updated = await authRepository.updateUserById(user._id.toString(), updates);
        user = updated ?? user;
      } catch {
        throw createError("Database error during user update", 500);
      }
    }
  }

  const userId = user._id.toString();
  const tokenPayload: TokenPayload = {
    userId,
    email: user.email ?? undefined,
  };
  const token = generateTokenWithExpiry(tokenPayload, JWT_EXPIRY_DAYS);

  return {
    token,
    user: toGoogleAuthUserResponse(user),
  };
};
