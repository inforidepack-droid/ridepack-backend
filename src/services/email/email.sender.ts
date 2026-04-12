import nodemailer, { type Transporter } from "nodemailer";
import { env, isSmtpEmailConfigured } from "@/config/env.config";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { logger } from "@/config/logger";
import type { SendEmailInput, SendEmailResult } from "@/services/email/email.types";

let cachedTransport: Transporter | null | undefined;

const buildTransport = (): Transporter | null => {
  if (!isSmtpEmailConfigured()) return null;
  const auth =
    env.SMTP_USER.trim().length > 0
      ? { user: env.SMTP_USER.trim(), pass: env.SMTP_PASS.trim() }
      : undefined;
  return nodemailer.createTransport({
    host: env.SMTP_HOST.trim(),
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(auth ? { auth } : {}),
  });
};

const getTransport = (): Transporter | null => {
  if (cachedTransport !== undefined) return cachedTransport;
  cachedTransport = buildTransport();
  return cachedTransport;
};

/** Clears cached transport (e.g. after tests or env reload). */
export const resetEmailTransportCache = (): void => {
  cachedTransport = undefined;
};

/**
 * Sends one email via SMTP. Requires SMTP_HOST, EMAIL_FROM, and auth if SMTP_USER is set.
 * At least one of `text` or `html` must be non-empty.
 */
export const sendEmail = async (input: SendEmailInput): Promise<SendEmailResult> => {
  const hasBody = Boolean((input.text && input.text.trim().length > 0) || (input.html && input.html.trim().length > 0));
  if (!hasBody) {
    throw createError("Email must include non-empty text or html", HTTP_STATUS.BAD_REQUEST);
  }

  const transport = getTransport();
  if (!transport) {
    throw createError(
      "Email is not configured. Set SMTP_HOST, EMAIL_FROM, and optional SMTP_USER/SMTP_PASS",
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  const from = (input.from ?? env.EMAIL_FROM).trim();
  const to = Array.isArray(input.to) ? [...input.to] : [input.to];

  try {
    const info = await transport.sendMail({
      from,
      to: to.join(", "),
      subject: input.subject.trim(),
      ...(input.text !== undefined ? { text: input.text } : {}),
      ...(input.html !== undefined ? { html: input.html } : {}),
      ...(input.replyTo ? { replyTo: input.replyTo.trim() } : {}),
    });
    const messageId = typeof info.messageId === "string" ? info.messageId : "";
    logger.info("Email sent", { to, subject: input.subject, messageId });
    return { messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SMTP send failed";
    logger.error("Email send failed", { to, subject: input.subject, error: msg });
    throw createError(`Failed to send email: ${msg}`, HTTP_STATUS.BAD_GATEWAY);
  }
};
