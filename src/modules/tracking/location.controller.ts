import type { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess } from "@/utils/responseFormatter";
import { updateRiderLocation } from "@/modules/tracking/location.service";
import type { AuthRequest } from "@/middlewares/auth";

export const updateLocationController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }
    const { lat, lng } = req.body as { lat: number; lng: number };
    const result = await updateRiderLocation(req.user.userId, lat, lng);
    sendSuccess(res, { data: result });
  }
);
