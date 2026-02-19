import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import * as rideService from "@/modules/ride/ride.service";
import { AuthRequest } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";

export const createRideController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new Error("Unauthorized");
  const ride = await rideService.createRide(req.user.userId, req.body);
  sendCreated(res, { data: ride });
});

export const getRideController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new Error("Unauthorized");
  const ride = await rideService.getById(req.params.id);
  sendSuccess(res, { data: ride });
});

export const getMyRidesController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new Error("Unauthorized");
  const rides = await rideService.getByUserId(req.user.userId);
  sendSuccess(res, { data: rides });
});
