import twilio from "twilio";
import { env } from "@/config/env.config";

export const getTwilioClient = (): ReturnType<typeof twilio> | null => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
};
