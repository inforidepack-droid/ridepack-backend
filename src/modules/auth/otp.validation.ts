import { z } from "zod";
import { normalizePhoneForOtp } from "@/modules/auth/phoneE164.utils";

const phoneBody = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  countryCode: z
    .string()
    .regex(
      /^\+\d{1,4}$/,
      "Country code must be like +91 (required when phoneNumber has no + prefix)"
    )
    .optional(),
});

export const sendOtpSchema = phoneBody.refine((data) => normalizePhoneForOtp(data) !== null, {
  message: "Invalid phone number format",
  path: ["phoneNumber"],
});

export const verifyOtpSchema = phoneBody
  .extend({
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must be 6 numeric digits"),
  })
  .refine((data) => normalizePhoneForOtp(data) !== null, {
    message: "Invalid phone number format",
    path: ["phoneNumber"],
  });

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
