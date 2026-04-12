import { SendOtpDto, VerifyOtpDto, VerifyOtpResponse } from "@/modules/auth/auth.types";
import { toAuthUserResponse } from "@/modules/auth/auth.utils";
import { generateToken, generateRefreshToken, type TokenPayload } from "@/utils/token.util";
import { createError } from "@/utils/appError";
import { hashPassword, comparePassword } from "@/utils/password.util";
import * as authRepository from "@/modules/auth/auth.repository";
import { normalizePhoneForOtp } from "@/modules/auth/phoneE164.utils";
import { assertOtpSendRateLimit } from "@/modules/auth/otp.rateLimit";
import { sendLoginOtpWhatsApp } from "@/modules/auth/otp.twilio.delivery";
import { generateOtp } from "@/utils/otpGenerator";
import { env } from "@/config/env.config";
import { buildFcmPatch } from "@/modules/user/user.profile.utils";
import type { IUser } from "@/modules/auth/models/User.model";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

/** Fixed OTP in `NODE_ENV === "development"` only (never in production). */
const DEV_STATIC_OTP = "1234";

const isDevMode = (): boolean => env.NODE_ENV === "development";

const requireNormalizedPhone = (dto: SendOtpDto | VerifyOtpDto) => {
  const normalized = normalizePhoneForOtp(dto);
  if (!normalized) {
    throw createError("Invalid phone number format", 400);
  }
  return normalized;
};

const issueTokensAfterOtpSuccess = async (
  dto: VerifyOtpDto,
  normalized: { countryCode: string; nationalNumber: string }
): Promise<VerifyOtpResponse> =>
  issueTokensForPhoneUser(dto, normalized.nationalNumber, normalized.countryCode);

const issueTokensForPhoneUser = async (
  dto: VerifyOtpDto,
  nationalNumber: string,
  countryCode: string
): Promise<VerifyOtpResponse> => {
  const fcmPatch: Partial<IUser> = buildFcmPatch({
    fcmToken: dto.fcmToken,
    deviceType: dto.deviceType,
  });

  let user = await authRepository.findUserByPhone(nationalNumber, countryCode);
  if (!user) {
    user = await authRepository.createUser({
      phoneNumber: nationalNumber,
      countryCode,
      isPhoneVerified: true,
      authProvider: "phone",
      ...fcmPatch,
    });
  } else {
    const updated = await authRepository.updateUserById(user._id.toString(), {
      isPhoneVerified: true,
      authProvider: user.authProvider ?? "phone",
      ...fcmPatch,
    });
    user = updated ?? user;
  }

  const userId = user._id.toString();
  const payload: TokenPayload = {
    userId,
    phoneNumber: user.phoneNumber ?? undefined,
    countryCode: user.countryCode ?? undefined,
  };
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await authRepository.setRefreshToken(userId, refreshToken, 7 * 24 * 60 * 60);

  const userData = toAuthUserResponse(user);

  return {
    success: true,
    data: {
      user: userData,
      accessToken,
      refreshToken,
    },
  };
};

export const sendOtp = async (
  sendOtpDto: SendOtpDto
): Promise<{ success: boolean; message: string }> => {
  const { e164, countryCode, nationalNumber } = requireNormalizedPhone(sendOtpDto);

  await assertOtpSendRateLimit(e164);

  const plainOtp = isDevMode() ? DEV_STATIC_OTP : generateOtp();
  const hashedOtp = await hashPassword(plainOtp);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  await authRepository.upsertOtp({
    phoneNumber: nationalNumber,
    countryCode,
    hashedOtp,
    expiresAt,
  });

  if (!isDevMode()) {
    await sendLoginOtpWhatsApp(e164, plainOtp);
  }

  /*
   * ─── SMS OTP (ENABLE AFTER A2P APPROVAL) — do not remove; switch delivery above ───
   * Option A — shared helper (Twilio SMS via `src/services/sms/sms.service.ts`):
   *   import { sendSms } from "@/services/sms/sms.service";
   *   const OTP_MESSAGE_TEMPLATE = (code: string) =>
   *     `Your Ridepack verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
   *   await sendSms(countryCode, nationalNumber, OTP_MESSAGE_TEMPLATE(plainOtp));
   *
   * Option B — direct Twilio (same as commented block in `otp.twilio.delivery.ts`):
   *   const client = getTwilioClient();
   *   if (!client) throw createError("OTP delivery is not configured.", 503);
   *   await client.messages.create({
   *     body: `Your RidePack OTP is ${plainOtp}`,
   *     from: process.env.TWILIO_SMS_NUMBER ?? "",
   *     to: e164,
   *   });
   *
   * When enabling SMS: comment out or remove the `sendLoginOtpWhatsApp` line above to avoid sending twice.
   */

  return { success: true, message: "OTP sent successfully" };
};

export const verifyOtp = async (verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponse> => {
  const normalized = requireNormalizedPhone(verifyOtpDto);
  const { countryCode, nationalNumber } = normalized;
  const { otp } = verifyOtpDto;

  if (isDevMode() && otp === DEV_STATIC_OTP) {
    await authRepository.deleteOtpByPhone(nationalNumber, countryCode);
    return issueTokensAfterOtpSuccess(verifyOtpDto, normalized);
  }

  const otpRecord = await authRepository.findOtpByPhone(nationalNumber, countryCode);
  if (!otpRecord) {
    throw createError("OTP not found. Please request a new OTP", 404);
  }
  if (otpRecord.isVerified) {
    throw createError("OTP has already been used", 400);
  }
  if (new Date() > otpRecord.expiresAt) {
    await authRepository.deleteOtpByPhone(nationalNumber, countryCode);
    throw createError("OTP has expired. Please request a new OTP", 400);
  }
  if (otpRecord.attemptCount >= MAX_ATTEMPTS) {
    throw createError("Maximum verification attempts exceeded. Please request a new OTP", 429);
  }

  const isValid = await comparePassword(otp, otpRecord.hashedOtp);
  if (!isValid) {
    const updated = await authRepository.incrementOtpAttempts(nationalNumber, countryCode);
    const attemptCount = updated?.attemptCount ?? otpRecord.attemptCount + 1;
    const remaining = MAX_ATTEMPTS - attemptCount;
    if (remaining <= 0) {
      throw createError("Maximum verification attempts exceeded. Please request a new OTP", 429);
    }
    throw createError(`Invalid OTP. ${remaining} attempt(s) remaining`, 400);
  }

  await authRepository.deleteOtpByPhone(nationalNumber, countryCode);

  return issueTokensAfterOtpSuccess(verifyOtpDto, normalized);
};
