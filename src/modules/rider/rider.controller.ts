import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import * as riderService from "@/modules/rider/rider.service";
import { AuthRequest } from "@/middlewares/auth";

export const createRiderController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const rider = await riderService.createRider(req.user.userId, req.body);
    sendCreated(res, { data: { rider }, message: "Rider profile created" });
  }
);

export const getRiderController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const rider = await riderService.getRiderByIdForResponse(id);
    sendSuccess(res, { data: rider });
  }
);

export const updateRiderController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const id = req.params.id as string;
    const rider = await riderService.updateRider(id, req.user.userId, req.body);
    sendSuccess(res, { data: { rider }, message: "Rider profile updated" });
  }
);

export const deleteRiderController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const id = req.params.id as string;
    await riderService.softDeleteRider(id, req.user.userId);
    sendSuccess(res, { message: "Rider profile deactivated (user blocked)" });
  }
);

export const getActiveRideController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const booking = await riderService.getActiveRideForRider(req.user.userId);
    sendSuccess(res, { data: booking });
  }
);
