import User from "@/modules/auth/models/User.model";
import { generateOtp } from "@/utils/otp.generate.utils";

/**
 * Ensures `User.profileOtp` exists (5-digit pickup OTP for parcel handoff).
 * Called after successful auth when the user has no code yet (Veriff also sets this on first approval).
 */
export const ensureProfileOtpIfMissing = async (userId: string): Promise<void> => {
  const u = await User.findById(userId).select("+profileOtp").lean().exec();
  if (!u) return;
  const existing = (u as { profileOtp?: string }).profileOtp?.trim();
  if (existing) return;
  const otp = generateOtp();
  await User.findByIdAndUpdate(userId, { $set: { profileOtp: otp } }).exec();
};
