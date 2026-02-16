import { z } from "zod";

export const sendOtpSchema = z.object({
  countryCode: z
    .string()
    .min(1, "Country code is required")
    .regex(/^\+\d{1,4}$/, "Country code must be in format +XXX (e.g., +1, +91)"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

export const verifyOtpSchema = z.object({
  countryCode: z
    .string()
    .min(1, "Country code is required")
    .regex(/^\+\d{1,4}$/, "Country code must be in format +XXX (e.g., +1, +91)"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  otp: z
    .string()
    .length(4, "OTP must be exactly 4 digits")
    .regex(/^\d{4}$/, "OTP must contain only 4 digits"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
