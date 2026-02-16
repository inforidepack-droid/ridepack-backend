import { Model } from "mongoose";
import { RefreshTokenDto } from "@/modules/auth/auth.types";
import { generateToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from "@/libs/jwt";
import { createError } from "@/middlewares/errorHandler";
import { redisClient } from "@/config/redis";
import User, { IUser } from "@/modules/auth/models/User.model";

const UserModel = User as Model<IUser>;

export const refreshToken = async (refreshTokenDto: RefreshTokenDto): Promise<{ token: string; refreshToken: string }> => {
  const { refreshToken } = refreshTokenDto;

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if refresh token exists in Redis
  const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
  if (!storedToken || storedToken !== refreshToken) {
    throw createError("Invalid refresh token", 401);
  }

  // Generate new tokens
  const tokenPayload: TokenPayload = {
    userId: decoded.userId,
    email: decoded.email || undefined,
    phoneNumber: decoded.phoneNumber || undefined,
    countryCode: decoded.countryCode || undefined,
  };

  const newToken = generateToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Update refresh token in Redis
  await redisClient.setEx(`refresh_token:${decoded.userId}`, 30 * 24 * 60 * 60, newRefreshToken);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId: string): Promise<void> => {
  // Remove refresh token from Redis
  await redisClient.del(`refresh_token:${userId}`);
};
