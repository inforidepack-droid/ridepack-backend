import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { normalizePhoneForOtp } from "@/modules/auth/phoneE164.utils";
import { USER_CONSTANTS } from "@/modules/user/user.constants";

const compactNational = (s: string): string => s.trim().replace(/\s/g, "");

const emptyToUndefined = (v: unknown): unknown =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const OTP_REGIONS_MSG = "Only US (+1) and India (+91) numbers are supported";

/** When digits fail for chosen country but match the other allowed region, suggest the fix. */
const otherRegionHint = (cc: string, rawDigits: string): string | null => {
  if (cc === "+1") {
    const asIndia = parsePhoneNumberFromString(`+91${rawDigits}`);
    if (asIndia?.isValid()) {
      return ' Not a valid US number for these digits. For India, use "countryCode": "+91" with the same phoneNumber.';
    }
  }
  if (cc === "+91") {
    const asUs = parsePhoneNumberFromString(`+1${rawDigits}`);
    if (asUs?.isValid()) {
      return ' Not a valid Indian number for these digits. For the US, use "countryCode": "+1" with the same phoneNumber.';
    }
  }
  return null;
};

const phoneBody = z.object({
  countryCode: z.preprocess(
    emptyToUndefined,
    z.union([z.undefined(), z.string().regex(/^\+\d{1,4}$/, "Country code must be like +1 or +91")])
  ),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

const addInvalidPhoneIssue = (
  data: { countryCode?: string; phoneNumber: string },
  ctx: z.RefinementCtx
): void => {
  if (normalizePhoneForOtp(data)) return;

  const raw = compactNational(data.phoneNumber);

  if (raw.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(raw);
    if (parsed?.isValid()) {
      const cc = `+${parsed.countryCallingCode}`;
      if (cc !== "+1" && cc !== "+91") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: OTP_REGIONS_MSG,
          path: ["phoneNumber"],
        });
        return;
      }
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid phone number for this country code",
      path: ["phoneNumber"],
    });
    return;
  }

  const cc = data.countryCode?.trim().replace(/\s/g, "") ?? "";
  if (cc !== "+1" && cc !== "+91") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "countryCode must be +1 or +91 for national format",
      path: ["countryCode"],
    });
    return;
  }

  if (!/^\d+$/.test(raw)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Phone number must be national digits only (optional spaces)",
      path: ["phoneNumber"],
    });
    return;
  }

  const parsedNational = parsePhoneNumberFromString(`${cc}${raw}`);
  if (!parsedNational) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid phone number for this country code",
      path: ["phoneNumber"],
    });
    return;
  }
  if (!parsedNational.isValid() && parsedNational.isPossible()) {
    const hint = otherRegionHint(cc, raw) ?? "";
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid phone number for the selected country code.${hint}`,
      path: ["phoneNumber"],
    });
    return;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Invalid phone number for this country code",
    path: ["phoneNumber"],
  });
};

export const sendOtpSchema = phoneBody.superRefine((data, ctx) => {
  const raw = compactNational(data.phoneNumber);
  if (!raw.startsWith("+") && !/^\d+$/.test(raw)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Phone number must be national digits only (optional spaces)",
      path: ["phoneNumber"],
    });
    return;
  }
  addInvalidPhoneIssue(data, ctx);
});

export const verifyOtpSchema = phoneBody
  .extend({
    otp: z
      .string()
      .length(4, "OTP must be exactly 4 digits")
      .regex(/^\d{4}$/, "OTP must be 4 numeric digits"),
    fcmToken: z.preprocess(
      emptyToUndefined,
      z.union([
        z.undefined(),
        z.string().min(1).max(USER_CONSTANTS.FCM_TOKEN_MAX),
      ])
    ),
    deviceType: z.preprocess(
      emptyToUndefined,
      z.union([z.undefined(), z.enum([...USER_CONSTANTS.DEVICE_TYPES])])
    ),
  })
  .superRefine((data, ctx) => {
    const raw = compactNational(data.phoneNumber);
    if (!raw.startsWith("+") && !/^\d+$/.test(raw)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number must be national digits only (optional spaces)",
        path: ["phoneNumber"],
      });
      return;
    }
    addInvalidPhoneIssue(data, ctx);
  });

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
