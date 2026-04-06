import { randomInt } from "node:crypto";

/** 4-digit numeric OTP (0000–9999). */
export const generateOtp = (): string => randomInt(0, 10_000).toString().padStart(4, "0");
