import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import * as riderRepository from "@/modules/rider/rider.repository";
import User from "@/modules/auth/models/User.model";
import { VEHICLE_TYPE } from "@/modules/rider/rider.constants";

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;

export type CreateRiderInput = {
  vehicleType: string;
  vehicleDetails?: { model?: string; color?: string; plateNumber?: string };
};

export const createRider = async (
  userId: string,
  data: CreateRiderInput
): Promise<riderRepository.RiderLean> => {
  const existing = await riderRepository.findByUserId(userId);
  if (existing) {
    throw createError("Rider profile already exists for this user", HTTP_STATUS.BAD_REQUEST);
  }
  if (data.vehicleType === VEHICLE_TYPE.OWN_VEHICLE) {
    const v = data.vehicleDetails;
    if (!v?.model?.trim() || !v?.color?.trim() || !v?.plateNumber?.trim()) {
      throw createError("vehicleDetails (model, color, plateNumber) required when vehicleType is own_vehicle", HTTP_STATUS.BAD_REQUEST);
    }
  }
  if (data.vehicleType && !Object.values(VEHICLE_TYPE).includes(data.vehicleType as typeof VEHICLE_TYPE[keyof typeof VEHICLE_TYPE])) {
    throw createError("Invalid vehicleType", HTTP_STATUS.BAD_REQUEST);
  }
  return riderRepository.create({
    userId,
    vehicleType: data.vehicleType,
    vehicleDetails: data.vehicleDetails,
  });
};

export const getRiderByIdForResponse = async (id: string) => {
  if (!isValidObjectId(id)) {
    throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);
  }
  const rider = await riderRepository.findByIdWithUser(id);
  if (!rider) {
    throw createError("Rider profile not found", HTTP_STATUS.NOT_FOUND);
  }
  const u = rider.userId as { _id?: mongoose.Types.ObjectId; name?: string; email?: string; phoneNumber?: string } | null;
  const userId = u && typeof u === "object" && "_id" in u ? (u._id ?? rider.userId) : rider.userId;
  return {
    _id: rider._id,
    userId,
    isKycVerified: rider.isKycVerified,
    vehicleType: rider.vehicleType,
    vehicleDetails: rider.vehicleDetails,
    rating: rider.rating,
    totalTrips: rider.totalTrips,
    totalDeliveries: rider.totalDeliveries,
    createdAt: rider.createdAt,
    updatedAt: rider.updatedAt,
    user: u && typeof u === "object" ? { name: u.name, email: u.email, phone: u.phoneNumber } : undefined,
  };
};

export type UpdateRiderInput = {
  vehicleType?: string;
  vehicleDetails?: { model?: string; color?: string; plateNumber?: string };
};

export const updateRider = async (
  id: string,
  userId: string,
  data: UpdateRiderInput
): Promise<riderRepository.RiderLean> => {
  if (!isValidObjectId(id)) {
    throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);
  }
  const rider = await riderRepository.findByIdWithUser(id);
  if (!rider) {
    throw createError("Rider profile not found", HTTP_STATUS.NOT_FOUND);
  }
  const riderUserId = (rider.userId as { _id?: mongoose.Types.ObjectId })?._id?.toString() ?? (rider.userId as unknown as mongoose.Types.ObjectId).toString();
  if (riderUserId !== userId) {
    throw createError("Only the owner can update this rider profile", HTTP_STATUS.FORBIDDEN);
  }
  const user = await User.findById(userId).select("isBlocked").lean().exec();
  if ((user as { isBlocked?: boolean })?.isBlocked) {
    throw createError("Blocked rider cannot update profile", HTTP_STATUS.FORBIDDEN);
  }
  if (data.vehicleType === VEHICLE_TYPE.OWN_VEHICLE && data.vehicleDetails) {
    const v = data.vehicleDetails;
    if (!v.model?.trim() || !v.color?.trim() || !v.plateNumber?.trim()) {
      throw createError("vehicleDetails (model, color, plateNumber) required when vehicleType is own_vehicle", HTTP_STATUS.BAD_REQUEST);
    }
  }
  const updatePayload: UpdateRiderInput = {};
  if (data.vehicleType !== undefined) updatePayload.vehicleType = data.vehicleType;
  if (data.vehicleDetails !== undefined) updatePayload.vehicleDetails = data.vehicleDetails;
  const updated = await riderRepository.updateById(id, updatePayload);
  if (!updated) throw createError("Rider profile not found", HTTP_STATUS.NOT_FOUND);
  return updated;
};

export const softDeleteRider = async (id: string, userId: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);
  }
  const rider = await riderRepository.findById(id);
  if (!rider) {
    throw createError("Rider profile not found", HTTP_STATUS.NOT_FOUND);
  }
  const riderUserId = (rider.userId as unknown as mongoose.Types.ObjectId).toString();
  if (riderUserId !== userId) {
    throw createError("Only the owner can delete this rider profile", HTTP_STATUS.FORBIDDEN);
  }
  await User.findByIdAndUpdate(riderUserId, { $set: { isBlocked: true } }).exec();
}
