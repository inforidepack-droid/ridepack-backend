import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/middlewares/errorHandler";
import { refreshToken, logout } from "@/modules/auth/auth.service";
import { RefreshTokenDto } from "@/modules/auth/auth.types";
import { redisClient } from "@/config/redis";
import { IUser } from "./models/User.model";
import { TokenPayload } from "@/libs/jwt";
import { generateRefreshToken, generateToken } from "@/libs/jwt";

export const googleCallback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as unknown as IUser;

  if (!user || !user._id) {
    throw createError("Authentication failed", 401);
  }

  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await redisClient.setEx(`refresh_token:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

  res.status(200).json({
    success: true,
    data: { token, refreshToken },
  });
});

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const refreshTokenDto: RefreshTokenDto = req.body;
    const result = await refreshToken(refreshTokenDto);
    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const logoutController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as TokenPayload | undefined;

  if (!user || !user.userId) {
    throw createError("Unauthorized", 401);
  }

  await logout(user.userId);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
