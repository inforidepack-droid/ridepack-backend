import bcrypt from "bcryptjs";
import { Model } from "mongoose";
import { SendOtpDto, VerifyOtpDto, OtpResponse, VerifyOtpResponse } from "@/modules/auth/auth.types";
import { generateToken, generateRefreshToken, TokenPayload } from "@/libs/jwt";
import { createError } from "@/middlewares/errorHandler";
import { redisClient } from "@/config/redis";
import User, { IUser } from "@/modules/auth/models/User.model";
import Otp, { IOtp } from "@/modules/auth/models/Otp.model";
import { logger } from "@/config/logger";

const UserModel = User as Model<IUser>;
const OtpModel = Otp as Model<IOtp>;

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;

const generateOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const mockSendSms = async (countryCode: string, phoneNumber: string, otp: string): Promise<void> => {
  logger.info(`[MOCK SMS] Sending OTP to ${countryCode}${phoneNumber}: ${otp}`);
  await new Promise((resolve) => setTimeout(resolve, 100));
};

export const sendOtp = async (sendOtpDto: SendOtpDto): Promise<OtpResponse> => {
  const { countryCode, phoneNumber } = sendOtpDto;

  const plainOtp = generateOtp();
  const hashedOtp = await bcrypt.hash(plainOtp, 10);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  await OtpModel.findOneAndUpdate(
    { phoneNumber, countryCode },
    {
      phoneNumber,
      countryCode,
      hashedOtp,
      expiresAt,
      attemptCount: 0,
      isVerified: false,
    },
    { upsert: true, new: true }
  );

  await mockSendSms(countryCode, phoneNumber, plainOtp);

  return {
    success: true,
    message: "OTP sent successfully",
  };
};

export const verifyOtp = async (verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponse> => {
  const { countryCode, phoneNumber, otp } = verifyOtpDto;

  const otpRecord = await OtpModel.findOne({ phoneNumber, countryCode });

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

  const isOtpValid = await bcrypt.compare(otp, otpRecord.hashedOtp);

  if (!isOtpValid) {
    otpRecord.attemptCount += 1;
    await otpRecord.save();

    const remainingAttempts = MAX_ATTEMPTS - otpRecord.attemptCount;
    if (remainingAttempts === 0) {
      throw createError("Maximum verification attempts exceeded. Please request a new OTP", 429);
    }

    throw createError(`Invalid OTP. ${remainingAttempts} attempt(s) remaining`, 400);
  }

  otpRecord.isVerified = true;
  await otpRecord.save();

  let user = await UserModel.findOne({ phoneNumber, countryCode });

  if (!user) {
    user = new UserModel({
      phoneNumber,
      countryCode,
      isPhoneVerified: true,
    });
    await user.save();
  } else {
    user.isPhoneVerified = true;
    await user.save();
  }

  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    phoneNumber: user.phoneNumber,
    countryCode: user.countryCode,
  };

  const accessToken = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await redisClient.setEx(`refresh_token:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

  return {
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber || "",
        countryCode: user.countryCode || "",
        isPhoneVerified: user.isPhoneVerified,
      },
      accessToken,
      refreshToken,
    },
  };
};
