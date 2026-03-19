import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendCreated, sendSuccess } from "@/utils/responseFormatter";
import * as vehicleService from "@/modules/vehicle/vehicle.service";
import type { AuthRequest } from "@/middlewares/auth";

export const addVehicleController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.userId) throw createError("Unauthorized", 401);
    const vehicle = await vehicleService.addVehicle(req.user.userId, req.body);
    sendCreated(res, { data: vehicle, message: "Vehicle added" });
  }
);

export const getMyVehiclesController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.userId) throw createError("Unauthorized", 401);
    const vehicles = await vehicleService.getVehiclesByRiderId(req.user.userId);
    sendSuccess(res, { data: vehicles });
  }
);

export const getVehicleByIdController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.userId) throw createError("Unauthorized", 401);
    const { id } = req.params as { id: string };
    const vehicle = await vehicleService.getVehicleByIdForOwner(id, req.user.userId);
    sendSuccess(res, { data: vehicle });
  }
);

export const updateVehicleController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.userId) throw createError("Unauthorized", 401);
    const { id } = req.params as { id: string };
    const vehicle = await vehicleService.updateVehicle(id, req.user.userId, req.body);
    sendSuccess(res, { data: vehicle, message: "Vehicle updated" });
  }
);

export const deleteVehicleController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.userId) throw createError("Unauthorized", 401);
    const { id } = req.params as { id: string };
    await vehicleService.softDeleteVehicle(id, req.user.userId);
    sendSuccess(res, { message: "Vehicle deactivated" });
  }
);

