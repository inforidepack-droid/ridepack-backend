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
import { env, isTwilioConfigured, isTwilioWhatsAppOtpConfigured } from "@/config/env.config";
import { buildFcmPatch } from "@/modules/user/user.profile.utils";
import { ensureProfileOtpIfMissing } from "@/modules/user/user.profileOtp.utils";
import * as userRepository from "@/modules/user/user.repository";
import { sendSms } from "@/services/sms/sms.service";
import { logger } from "@/config/logger";
import { HTTP_STATUS } from "@/constants/http.constants";
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

const buildSmsOtpBody = (code: string): string =>
  `Your RidePack verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

/** Non-dev: sends OTP via WhatsApp and/or SMS when each channel is configured. */
const deliverOtpNonDev = async (params: {
  e164: string;
  countryCode: string;
  nationalNumber: string;
  plainOtp: string;
}): Promise<void> => {
  const whatsAppReady = isTwilioWhatsAppOtpConfigured();
  const smsReady = isTwilioConfigured();

  if (!whatsAppReady && !smsReady) {
    throw createError(
      "OTP delivery is not configured. Set Twilio WhatsApp (TWILIO_WHATSAPP_NUMBER + TWILIO_OTP_CONTENT_SID) and/or SMS (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_NUMBER or TWILIO_PHONE_NUMBER).",
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  if (whatsAppReady) {
    await sendLoginOtpWhatsApp(params.e164, params.plainOtp);
  }

  if (smsReady) {
    try {
      await sendSms(params.countryCode, params.nationalNumber, buildSmsOtpBody(params.plainOtp));
    } catch (err) {
      const detail = err instanceof Error ? err.message : "SMS send failed";
      logger.error("OTP SMS delivery failed", { detail });
      if (!whatsAppReady) {
        throw createError(`Failed to send OTP via SMS: ${detail}`, HTTP_STATUS.BAD_GATEWAY);
      }
    }
  }
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
  await ensureProfileOtpIfMissing(userId);
  const userWithOtp = await userRepository.findByIdWithProfileOtp(userId);
  const payload: TokenPayload = {
    userId,
    phoneNumber: user.phoneNumber ?? undefined,
    countryCode: user.countryCode ?? undefined,
  };
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await authRepository.setRefreshToken(userId, refreshToken, 7 * 24 * 60 * 60);

  const userData = toAuthUserResponse(userWithOtp ?? user);

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
    await deliverOtpNonDev({ e164, countryCode, nationalNumber, plainOtp });
  }

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
