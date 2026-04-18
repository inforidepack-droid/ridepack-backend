import { randomInt } from "node:crypto";

/** Login phone OTP uses `src/utils/otpGenerator.ts` (4-digit). */

const randomFiveDigitNumeric = (): string => randomInt(10000, 100_000).toString();

/** 5-digit (10000–99999) — sender `User.profileOtp` / pickup handoff (Veriff, backfill, ensure). */
export const generateOtp = (): string => randomFiveDigitNumeric();

/** 5-digit (10000–99999) — receiver `Booking.deliveryOtp` per booking. */
export const generateDeliveryOtp = (): string => randomFiveDigitNumeric();
