import User, { IUser } from "@/modules/auth/models/User.model";
import Otp, { IOtp } from "@/modules/auth/models/Otp.model";
import { redisClient } from "@/config/redis";

const REFRESH_TOKEN_PREFIX = "refresh_token:";
const REFRESH_TOKEN_TTL_SEC = 30 * 24 * 60 * 60;

const refreshTokenKey = (userId: string) => `${REFRESH_TOKEN_PREFIX}${userId}`;

export const getRefreshToken = (userId: string): Promise<string | null> =>
  redisClient.get(refreshTokenKey(userId));

export const setRefreshToken = (userId: string, token: string, ttlSec: number = REFRESH_TOKEN_TTL_SEC): Promise<void> =>
  redisClient.setEx(refreshTokenKey(userId), ttlSec, token).then(() => undefined);

export const deleteRefreshToken = (userId: string): Promise<void> =>
  redisClient.del(refreshTokenKey(userId)).then(() => undefined);

export const findOtpByPhone = (phoneNumber: string, countryCode: string): Promise<IOtp | null> =>
  Otp.findOne({ phoneNumber, countryCode }).exec();

export const upsertOtp = (data: {
  phoneNumber: string;
  countryCode: string;
  hashedOtp: string;
  expiresAt: Date;
}): Promise<IOtp> =>
  Otp.findOneAndUpdate(
    { phoneNumber: data.phoneNumber, countryCode: data.countryCode },
    {
      ...data,
      attemptCount: 0,
      isVerified: false,
    },
    { upsert: true, new: true }
  ).exec() as Promise<IOtp>;

export const incrementOtpAttempts = (phoneNumber: string, countryCode: string): Promise<IOtp | null> =>
  Otp.findOneAndUpdate(
    { phoneNumber, countryCode },
    { $inc: { attemptCount: 1 } },
    { new: true }
  ).exec();

export const markOtpVerified = (phoneNumber: string, countryCode: string): Promise<IOtp | null> =>
  Otp.findOneAndUpdate(
    { phoneNumber, countryCode },
    { isVerified: true },
    { new: true }
  ).exec();

export const findUserByPhone = (phoneNumber: string, countryCode: string): Promise<IUser | null> =>
  User.findOne({ phoneNumber, countryCode }).exec();

export const createUser = (data: Partial<IUser>): Promise<IUser> => User.create(data);

export const updateUserById = (id: string, data: Partial<IUser>): Promise<IUser | null> =>
  User.findByIdAndUpdate(id, data, { new: true }).exec();
