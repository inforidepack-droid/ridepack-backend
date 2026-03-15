import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import User from "@/modules/auth/models/User.model";
import RiderLocation from "@/modules/tracking/riderLocation.model";
import {
  LAT_MIN,
  LAT_MAX,
  LNG_MIN,
  LNG_MAX,
  RIDER_LOCATION_UPDATE_INTERVAL_MS,
} from "@/modules/tracking/tracking.constants";

const isValidLat = (lat: number): boolean =>
  typeof lat === "number" && !Number.isNaN(lat) && lat >= LAT_MIN && lat <= LAT_MAX;

const isValidLng = (lng: number): boolean =>
  typeof lng === "number" && !Number.isNaN(lng) && lng >= LNG_MIN && lng <= LNG_MAX;

export const validateCoordinates = (lat: number, lng: number): void => {
  if (!isValidLat(lat)) {
    throw createError(
      `Invalid lat: must be a number between ${LAT_MIN} and ${LAT_MAX}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }
  if (!isValidLng(lng)) {
    throw createError(
      `Invalid lng: must be a number between ${LNG_MIN} and ${LNG_MAX}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

export const updateRiderLocation = async (
  riderId: string,
  lat: number,
  lng: number
): Promise<{ lat: number; lng: number; updatedAt: Date }> => {
  validateCoordinates(lat, lng);

  if (!mongoose.Types.ObjectId.isValid(riderId)) {
    throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findById(riderId).select("role").lean().exec();
  if (!user) {
    throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  if ((user as { role?: string }).role !== "rider") {
    throw createError("Only riders can update location", HTTP_STATUS.FORBIDDEN);
  }

  const riderObjId = new mongoose.Types.ObjectId(riderId);
  const existing = await RiderLocation.findOne({ riderId: riderObjId }).lean().exec();

  if (existing && existing.updatedAt) {
    const elapsed = Date.now() - new Date(existing.updatedAt).getTime();
    if (elapsed < RIDER_LOCATION_UPDATE_INTERVAL_MS) {
      throw createError(
        `Location can be updated at most once every ${RIDER_LOCATION_UPDATE_INTERVAL_MS / 1000} seconds`,
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }
  }

  const updated = await RiderLocation.findOneAndUpdate(
    { riderId: riderObjId },
    { $set: { lat, lng } },
    { new: true, upsert: true }
  )
    .lean()
    .exec();

  if (!updated) {
    throw createError("Failed to update rider location", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return {
    lat: updated.lat,
    lng: updated.lng,
    updatedAt: updated.updatedAt,
  };
};
