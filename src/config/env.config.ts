/**
 * Central env config. Read-only; do not mutate process.env here.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  MONGODB_URI:
    process.env.NODE_ENV === "production"
      ? process.env.MONGODB_URI
      : process.env.MONGODB_URI_LOCAL || "mongodb://localhost:27017/ridepack",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
  /** Legacy SMS “from” for non-OTP SMS helpers; OTP SMS uses TWILIO_SMS_NUMBER when re-enabled. */
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "",
  /** Twilio WhatsApp sender, e.g. whatsapp:+14155238886 */
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ?? "",
  /** SMS “from” when A2P is approved (OTP SMS path is commented until then). */
  TWILIO_SMS_NUMBER: process.env.TWILIO_SMS_NUMBER ?? "",
  /** Twilio Content template SID for OTP (variable "1" = code). */
  TWILIO_OTP_CONTENT_SID: process.env.TWILIO_OTP_CONTENT_SID ?? "",
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  S3_BUCKET: process.env.S3_BUCKET ?? "",
  VERIFF_API_KEY: process.env.VERIFF_API_KEY ?? "",
  VERIFF_WEBHOOK_SECRET: process.env.VERIFF_WEBHOOK_SECRET ?? "",
  VERIFF_CALLBACK_URL: process.env.VERIFF_CALLBACK_URL ?? "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  /** ISO 4217 lowercase, e.g. usd — must match PaymentIntent currency */
  STRIPE_CURRENCY: (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase(),
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  ENABLE_SOCKET: (process.env.ENABLE_SOCKET || "false").toLowerCase() === "true",
  /** Min length 16. Required for POST /api/wallet/credit (header x-wallet-internal-secret). */
  WALLET_INTERNAL_SECRET: process.env.WALLET_INTERNAL_SECRET ?? "",
} as const;

/** SMS helper (`sendSms`) is “configured” when Twilio creds exist and a from-number is set (SMS or legacy phone). */
export const isTwilioConfigured = (): boolean =>
  Boolean(
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    (env.TWILIO_SMS_NUMBER || env.TWILIO_PHONE_NUMBER)
  );

/** OTP is sent via WhatsApp; requires Content SID and WhatsApp-enabled sender. */
export const isTwilioWhatsAppOtpConfigured = (): boolean =>
  Boolean(
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    env.TWILIO_WHATSAPP_NUMBER &&
    env.TWILIO_OTP_CONTENT_SID
  );

export const isS3Configured = (): boolean =>
  Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET);
