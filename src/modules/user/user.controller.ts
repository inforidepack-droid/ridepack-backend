import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { sendSuccess } from "@/utils/responseFormatter";
import { createError } from "@/utils/appError";
import { toAuthUserResponse } from "@/modules/auth/auth.utils";
import * as userService from "@/modules/user/user.service";
import { AuthRequest } from "@/middlewares/auth";

export const getProfileController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw createError("Unauthorized", 401);
  const user = await userService.getProfile(req.user.userId);
  sendSuccess(res, { data: toAuthUserResponse(user) });
});

export const updateProfileController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw createError("Unauthorized", 401);
  const user = await userService.updateProfile(req.user.userId, req.body);
  sendSuccess(res, { data: toAuthUserResponse(user) });
});
