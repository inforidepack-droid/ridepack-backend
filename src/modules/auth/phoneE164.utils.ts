import { parsePhoneNumberFromString } from "libphonenumber-js";

export type NormalizedPhone = {
  e164: string;
  countryCode: string;
  nationalNumber: string;
};

const trim = (s: string): string => s.trim();

/**
 * Normalizes to E.164 parts for storage (national number + country calling code).
 * Accepts full E.164 in `phoneNumber`, or national digits with `countryCode` (+CC).
 */
export const normalizePhoneForOtp = (input: {
  phoneNumber: string;
  countryCode?: string;
}): NormalizedPhone | null => {
  const rawPhone = trim(input.phoneNumber);
  if (!rawPhone) {
    return null;
  }

  const full = rawPhone.startsWith("+")
    ? rawPhone
    : input.countryCode
      ? `${trim("+91").replace(/\s/g, "")}${rawPhone.replace(/\s/g, "")}`
      : null;

  if (!full) {
    return null;
  }

  const parsed = parsePhoneNumberFromString(full);
  if (!parsed?.isValid()) {
    return null;
  }

  return {
    e164: parsed.format("E.164"),
    countryCode: `+${parsed.countryCallingCode}`,
    nationalNumber: parsed.nationalNumber,
  };
};
