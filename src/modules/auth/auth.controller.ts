import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/middlewares/errorHandler";
import { refreshToken, logout } from "@/modules/auth/auth.service";
import { RefreshTokenDto } from "@/modules/auth/auth.types";
import { AuthRequest } from "@/middlewares/auth";

export const refreshTokenController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshTokenDto: RefreshTokenDto = req.body;
  const result = await refreshToken(refreshTokenDto);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const logoutController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError("Unauthorized", 401);
  }
  await logout(req.user.userId);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
