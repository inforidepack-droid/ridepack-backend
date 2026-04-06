import { redisClient } from "@/config/redis";
import { logger } from "@/config/logger";
import { createError, type AppError } from "@/utils/appError";

const KEY_PREFIX = "otp_send:";
const WINDOW_SEC = 60;
const MAX_SENDS_PER_WINDOW = 3;

const isRateLimitError = (e: unknown): e is AppError =>
  Boolean(e && typeof e === "object" && "statusCode" in e && (e as AppError).statusCode === 429);

/** Max 3 OTP send attempts per E.164 number per rolling minute (Redis). */
export const assertOtpSendRateLimit = async (e164: string): Promise<void> => {
  try {
    const key = `${KEY_PREFIX}${e164}`;
    const n = await redisClient.incr(key);
    if (n === 1) {
      await redisClient.expire(key, WINDOW_SEC);
    }
    if (n > MAX_SENDS_PER_WINDOW) {
      throw createError("Too many OTP requests. Please wait up to a minute and try again.", 429);
    }
  } catch (e) {
    if (isRateLimitError(e)) {
      throw e;
    }
    logger.error(`OTP send rate limit Redis error: ${e instanceof Error ? e.message : String(e)}`);
    throw createError("Service temporarily unavailable. Please try again.", 503);
  }
};
