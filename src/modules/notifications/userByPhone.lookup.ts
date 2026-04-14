import User from "@/modules/auth/models/User.model";
import { normalizePhoneForOtp } from "@/modules/auth/phoneE164.utils";

/** Resolve registered user id from receiver contact on booking (for FCM to receiver). */
export const findUserIdByPhoneContact = async (input: {
  phone: string;
  countryCode?: string;
}): Promise<string | null> => {
  const normalized = normalizePhoneForOtp({
    phoneNumber: input.phone.trim(),
    ...(input.countryCode ? { countryCode: input.countryCode.trim() } : {}),
  });
  if (!normalized) return null;
  const u = await User.findOne({
    countryCode: normalized.countryCode,
    phoneNumber: normalized.nationalNumber,
  })
    .select("_id")
    .lean()
    .exec();
  return u ? (u as { _id: { toString: () => string } })._id.toString() : null;
};
