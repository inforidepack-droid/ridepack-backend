import { SendOtpDto, VerifyOtpDto, VerifyOtpResponse } from "@/modules/auth/auth.types";
import { generateToken, generateRefreshToken, type TokenPayload } from "@/utils/token.util";
import { createError } from "@/utils/appError";
import { hashPassword, comparePassword } from "@/utils/password.util";
import * as authRepository from "@/modules/auth/auth.repository";
import { sendSms } from "@/services/sms/sms.service";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const OTP_MESSAGE_TEMPLATE = (code: string) =>
  `Your Ridepack verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

const generateOtpCode = (): string =>
  Math.floor(1000 + Math.random() * 9000).toString();

export const sendOtp = async (sendOtpDto: SendOtpDto): Promise<{ success: boolean; message: string }> => {
  const { countryCode, phoneNumber } = sendOtpDto;
  const plainOtp = generateOtpCode();
  const hashedOtp = await hashPassword(plainOtp);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  await authRepository.upsertOtp({
    phoneNumber,
    countryCode,
    hashedOtp,
    expiresAt,
  });
  await sendSms(countryCode, phoneNumber, OTP_MESSAGE_TEMPLATE(plainOtp));

  return { success: true, message: "OTP sent successfully" };
};

export const verifyOtp = async (verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponse> => {
  const { countryCode, phoneNumber, otp } = verifyOtpDto;

  const otpRecord = await authRepository.findOtpByPhone(phoneNumber, countryCode);
  if (!otpRecord) {
    throw createError("OTP not found. Please request a new OTP", 404);
  }
  if (otpRecord.isVerified) {
    throw createError("OTP has already been used", 400);
  }
  if (new Date() > otpRecord.expiresAt) {
    throw createError("OTP has expired. Please request a new OTP", 400);
  }
  if (otpRecord.attemptCount >= MAX_ATTEMPTS) {
    throw createError("Maximum verification attempts exceeded. Please request a new OTP", 429);
  }

  const isValid = await comparePassword(otp, otpRecord.hashedOtp);
  if (!isValid) {
    const updated = await authRepository.incrementOtpAttempts(phoneNumber, countryCode);
    const attemptCount = updated?.attemptCount ?? otpRecord.attemptCount + 1;
    const remaining = MAX_ATTEMPTS - attemptCount;
    if (remaining <= 0) {
      throw createError("Maximum verification attempts exceeded. Please request a new OTP", 429);
    }
    throw createError(`Invalid OTP. ${remaining} attempt(s) remaining`, 400);
  }

  await authRepository.markOtpVerified(phoneNumber, countryCode);

  let user = await authRepository.findUserByPhone(phoneNumber, countryCode);
  if (!user) {
    user = await authRepository.createUser({
      phoneNumber,
      countryCode,
      isPhoneVerified: true,
    });
  } else {
    const updated = await authRepository.updateUserById(user._id.toString(), { isPhoneVerified: true });
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

  return {
    success: true,
    data: {
      user: {
        id: userId,
        phoneNumber: user.phoneNumber ?? "",
        countryCode: user.countryCode ?? "",
        isPhoneVerified: user.isPhoneVerified,
      },
      accessToken,
      refreshToken,
    },
  };
};
