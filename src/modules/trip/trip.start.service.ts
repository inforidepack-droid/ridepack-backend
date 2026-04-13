import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import * as tripRepository from "@/modules/trip/trip.repository";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";
import type { TripLean } from "@/modules/trip/trip.repository";

export const startTrip = async (riderId: string, tripId: string): Promise<TripLean> => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError("Invalid trip id", HTTP_STATUS.BAD_REQUEST);
  }

  const trip = await tripRepository.findByIdWithRider(tripId, riderId);
  if (!trip) {
    const exists = await tripRepository.findById(tripId);
    if (!exists) throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
    throw createError("Only the trip owner can start this trip", HTTP_STATUS.FORBIDDEN);
  }

  if (trip.status === TRIP_STATUS.CANCELLED) {
    throw createError("Cancelled trips cannot be started", HTTP_STATUS.BAD_REQUEST);
  }
  if (trip.status === TRIP_STATUS.COMPLETED) {
    throw createError("Completed trips cannot be started", HTTP_STATUS.BAD_REQUEST);
  }
  if (trip.status === TRIP_STATUS.IN_PROGRESS) {
    throw createError("Trip is already in progress", HTTP_STATUS.BAD_REQUEST);
  }
  if (trip.status === TRIP_STATUS.DRAFT) {
    throw createError("Trip must be published before it can be started", HTTP_STATUS.BAD_REQUEST);
  }
  if (trip.status !== TRIP_STATUS.PUBLISHED) {
    throw createError(`Trip cannot be started from status: ${trip.status}`, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await tripRepository.atomicStartTrip(tripId, riderId);
  if (!updated) {
    throw createError(
      "Trip could not be started. It may no longer be published or was updated by another request.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  return updated;
};
