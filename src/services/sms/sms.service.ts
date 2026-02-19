import twilio from "twilio";
import { env, isTwilioConfigured } from "@/config/env.config";
import { logger } from "@/config/logger";

/**
 * Builds E.164 "to" number from countryCode and phoneNumber.
 * countryCode should include + (e.g. +1, +91).
 */
const toE164 = (countryCode: string, phoneNumber: string): string =>
  `${countryCode.replace(/\s/g, "")}${phoneNumber.replace(/\s/g, "")}`;

const sendViaTwilio = async (to: string, body: string): Promise<void> => {
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  const message = await client.messages.create({
    body,
    to,
    from: env.TWILIO_PHONE_NUMBER,
  });
  logger.info(`SMS sent via Twilio sid=${message.sid} to=${to}`);
};

const sendViaMock = (to: string, body: string): void => {
  logger.info(`[MOCK SMS] to=${to} body=${body}`);
};

/**
 * Sends an SMS to the given number. Uses Twilio if configured, otherwise logs (mock).
 */
export const sendSms = async (
  countryCode: string,
  phoneNumber: string,
  body: string
): Promise<void> => {
  const to = toE164(countryCode, phoneNumber);
  if (isTwilioConfigured()) {
    await sendViaTwilio(to, body);
  } else {
    sendViaMock(to, body);
  }
};
