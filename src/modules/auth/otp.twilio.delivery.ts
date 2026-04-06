import { env, isTwilioWhatsAppOtpConfigured } from "@/config/env.config";
import { getTwilioClient } from "@/config/twilio";
import { createError } from "@/utils/appError";
import { logger } from "@/config/logger";

const isLikelyContentSid = (sid: string): boolean => {
  const s = sid.trim();
  return s.length >= 34 && s.startsWith("HX");
};

const twilioErrorMessage = (err: unknown): string =>
  err &&
  typeof err === "object" &&
  "message" in err &&
  typeof (err as { message: unknown }).message === "string"
    ? (err as { message: string }).message
    : "Twilio request failed";

const twilioErrorCode = (err: unknown): string | undefined =>
  err && typeof err === "object" && "code" in err && (err as { code: unknown }).code != null
    ? String((err as { code: number | string }).code)
    : undefined;

/**
 * Sends login OTP via Twilio WhatsApp (Content API). SMS path remains commented until A2P approval.
 * Never logs the OTP in production.
 */
export const sendLoginOtpWhatsApp = async (e164: string, otp: string): Promise<void> => {
  if (!isTwilioWhatsAppOtpConfigured()) {
    throw createError(
      "OTP delivery is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, and TWILIO_OTP_CONTENT_SID.",
      503
    );
  }

  const contentSid = env.TWILIO_OTP_CONTENT_SID.trim();
  if (!isLikelyContentSid(contentSid)) {
    logger.error("TWILIO_OTP_CONTENT_SID is missing or malformed");
    throw createError("OTP delivery is misconfigured.", 503);
  }

  const client = getTwilioClient();
  if (!client) {
    throw createError("OTP delivery is not configured.", 503);
  }

  try {
    const message = await client.messages.create({
      from: env.TWILIO_WHATSAPP_NUMBER.trim(),
      contentSid,
      contentVariables: JSON.stringify({ "1": otp }),
      to: `whatsapp:${e164}`,
    });
    // Never log OTP; sid + status help debug delivery (sandbox vs production).
    logger.info(
      `WhatsApp OTP API accepted sid=${message.sid} status=${message.status ?? "unknown"} to=whatsapp:${e164}`
    );
  } catch (err: unknown) {
    const detail = twilioErrorMessage(err);
    const code = twilioErrorCode(err);
    logger.error(
      `Twilio WhatsApp OTP failed${code ? ` code=${code}` : ""}: ${detail}`
    );
    if (env.NODE_ENV !== "production") {
      throw createError(
        `Failed to send OTP (Twilio${code ? ` ${code}` : ""}): ${detail}`,
        502
      );
    }
    throw createError("Failed to send OTP. Please try again later.", 502);
  }

  /*
   * ─── SMS IMPLEMENTATION (ENABLE AFTER A2P APPROVAL) — full Twilio SMS path kept here, commented ───
   * Same pattern as legacy OTP SMS; uses E.164 `to`. Uncomment when A2P is approved and pause WhatsApp above if you only want SMS.
   *
   * await client.messages.create({
   *   body: `Your RidePack OTP is ${otp}`,
   *   from: process.env.TWILIO_SMS_NUMBER ?? "",
   *   to: e164,
   * });
   *
   * Or use the shared helper from `src/services/sms/sms.service.ts` (pass countryCode + nationalNumber, not e164):
   *   import { sendSms } from "@/services/sms/sms.service";
   *   await sendSms(countryCode, nationalNumber, `Your RidePack OTP is ${otp}. Valid for 5 minutes.`);
   * (Requires passing countryCode/nationalNumber into this function when you switch.)
   */
};
