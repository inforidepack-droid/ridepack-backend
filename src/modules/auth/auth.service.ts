import { RefreshTokenDto } from "@/modules/auth/auth.types";
import { generateToken, generateRefreshToken, verifyRefreshToken, type TokenPayload } from "@/utils/token.util";
import { createError } from "@/utils/appError";
import * as authRepository from "@/modules/auth/auth.repository";

export const refreshToken = async (refreshTokenDto: RefreshTokenDto): Promise<{ token: string; refreshToken: string }> => {
  const { refreshToken: token } = refreshTokenDto;
  const decoded = verifyRefreshToken(token);

  const storedToken = await authRepository.getRefreshToken(decoded.userId);
  if (!storedToken || storedToken !== token) {
    throw createError("Invalid refresh token", 401);
  }

  const payload: TokenPayload = {
    userId: decoded.userId,
    email: decoded.email ?? undefined,
    phoneNumber: decoded.phoneNumber ?? undefined,
    countryCode: decoded.countryCode ?? undefined,
  };

  const newAccessToken = generateToken(payload);
  const newRefreshToken = generateRefreshToken(payload);
  await authRepository.setRefreshToken(decoded.userId, newRefreshToken);

  return { token: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (userId: string): Promise<void> => {
  await authRepository.deleteRefreshToken(userId);
};
