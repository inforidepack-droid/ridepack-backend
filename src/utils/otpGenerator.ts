import { randomInt } from "node:crypto";

/** 6-digit numeric OTP (000000–999999). */
export const generateOtp = (): string => randomInt(0, 1_000_000).toString().padStart(6, "0");
