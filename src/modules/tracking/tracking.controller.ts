import type { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess } from "@/utils/responseFormatter";
import { getParcelTracking } from "@/modules/tracking/tracking.service";
import type { AuthRequest } from "@/middlewares/auth";

export const getParcelTrackingController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }
    const parcelId = req.params.parcelId as string;
    const tracking = await getParcelTracking(parcelId, req.user.userId);
    sendSuccess(res, { data: tracking });
  }
);
