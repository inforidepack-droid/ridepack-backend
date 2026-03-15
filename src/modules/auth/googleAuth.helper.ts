import { OAuth2Client } from "google-auth-library";
import { env } from "@/config/env.config";
import { createError } from "@/utils/appError";

export interface GoogleTokenPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

const getClient = (): OAuth2Client => {
  if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.trim() === "") {
    throw createError("Invalid GOOGLE_CLIENT_ID configuration", 500);
  }
  return new OAuth2Client(env.GOOGLE_CLIENT_ID);
};

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleTokenPayload> => {
  const client = getClient();
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw createError("Token verification failed: no payload", 401);
    }
    const email = payload.email;
    if (!email || typeof email !== "string" || email.trim() === "") {
      throw createError("Email missing in token payload", 400);
    }
    return {
      email: payload.email ?? "",
      name: payload.name ?? "",
      picture: payload.picture ?? "",
      sub: payload.sub ?? "",
    };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Token verification failed";
    if (message.toLowerCase().includes("expired")) {
      throw createError("Expired Google token", 401);
    }
    throw createError("Invalid Google token", 401);
  }
};
