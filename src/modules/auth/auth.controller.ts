import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/middlewares/errorHandler";
import { register, login, refreshToken, logout } from "@/modules/auth/auth.service";
import { RegisterDto, LoginDto, RefreshTokenDto } from "@/modules/auth/auth.types";
import { AuthRequest } from "@/middlewares/auth";

export const registerController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const registerDto: RegisterDto = req.body;
  const result = await register(registerDto);
  res.status(201).json(result);
});

export const loginController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const loginDto: LoginDto = req.body;
  const result = await login(loginDto);
  res.status(200).json(result);
});

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
