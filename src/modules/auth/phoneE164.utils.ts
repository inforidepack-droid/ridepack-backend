import { parsePhoneNumberFromString } from "libphonenumber-js";

export type NormalizedPhone = {
  e164: string;
  countryCode: string;
  nationalNumber: string;
};

/** US/Canada NANP (+1) and India (+91) only. */
const ALLOWED_CALLING_CODES = new Set(["+1", "+91"]);

const trim = (s: string): string => s.trim();

const isAllowedCallingCode = (cc: string): boolean => ALLOWED_CALLING_CODES.has(cc);

/**
 * US (+1) or India (+91). Accepts either:
 * - `countryCode: "+1" | "+91"` + national `phoneNumber` (digits, no +), or
 * - full E.164 in `phoneNumber`; optional `countryCode` if it matches the number.
 */
export const normalizePhoneForOtp = (input: {
  phoneNumber: string;
  countryCode?: string;
}): NormalizedPhone | null => {
  const rawPhone = trim(input.phoneNumber).replace(/\s/g, "");
  const rawCc = input.countryCode ? trim(input.countryCode).replace(/\s/g, "") : "";

  if (!rawPhone) {
    return null;
  }

  if (rawPhone.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(rawPhone);
    if (!parsed?.isValid()) {
      return null;
    }
    const parsedCc = `+${parsed.countryCallingCode}`;
    if (!isAllowedCallingCode(parsedCc)) {
      return null;
    }
    if (rawCc && rawCc !== parsedCc) {
      return null;
    }
    return {
      e164: parsed.format("E.164"),
      countryCode: parsedCc,
      nationalNumber: parsed.nationalNumber,
    };
  }

  if (!rawCc || !isAllowedCallingCode(rawCc)) {
    return null;
  }
  if (!/^\d+$/.test(rawPhone)) {
    return null;
  }

  const full = `${rawCc}${rawPhone}`;
  const parsed = parsePhoneNumberFromString(full);
  if (!parsed?.isValid()) {
    return null;
  }
  const parsedCc = `+${parsed.countryCallingCode}`;
  if (!isAllowedCallingCode(parsedCc)) {
    return null;
  }

  return {
    e164: parsed.format("E.164"),
    countryCode: parsedCc,
    nationalNumber: parsed.nationalNumber,
  };
};
