import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/middlewares/errorHandler";
import { refreshToken, logout } from "@/modules/auth/auth.service";
import { RefreshTokenDto } from "@/modules/auth/auth.types";
import { AuthRequest } from "@/middlewares/auth";
import { redisClient } from "@/config/redis";
import { IUser } from "./models/User.model";
import { logger } from "@/config/logger";
import { generateRefreshToken, generateToken } from "@/libs/jwt";

export const googleCallback = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Authentication failed", 401);
    }

    // Type guard
    if (!("_id" in req.user)) {
      throw createError("Invalid user object", 400);
    }

    const user = req.user as IUser;

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await redisClient.setEx(
      `refresh_token:${user._id}`,
      30 * 24 * 60 * 60,
      refreshToken
    );

    logger.info(`Google login success: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        token,
        refreshToken,
      },
    });
  }
);

export const refreshTokenController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshTokenDto: RefreshTokenDto = req.body;
  const result = await refreshToken(refreshTokenDto);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const logoutController = asyncHandler(
  async (req, res): Promise<void> => {
    
  const authReq = req as AuthRequest;

  if (!authReq.user) {
  throw createError("Unauthorized", 401);
  }

  await logout(authReq.user.userId);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
);

