import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import * as tripRepository from "@/modules/trip/trip.repository";
import * as bookingRepository from "@/modules/booking/booking.repository";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";

export const cancelTrip = async (riderId: string, tripId: string) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw createError("Invalid trip id", HTTP_STATUS.BAD_REQUEST);
  }

  const trip = await tripRepository.findByIdWithRider(tripId, riderId);
  if (!trip) {
    const exists = await tripRepository.findById(tripId);
    if (!exists) throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
    throw createError("Only the trip owner can cancel this trip", HTTP_STATUS.FORBIDDEN);
  }

  if (trip.status === TRIP_STATUS.CANCELLED) {
    throw createError("Trip is already cancelled", HTTP_STATUS.BAD_REQUEST);
  }

  if (trip.status === TRIP_STATUS.COMPLETED) {
    throw createError("Completed trips cannot be cancelled", HTTP_STATUS.BAD_REQUEST);
  }

  if (trip.status === TRIP_STATUS.IN_PROGRESS) {
    throw createError("In-progress trips cannot be cancelled", HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await tripRepository.atomicCancel(tripId, riderId);
  if (!updated) {
    throw createError("Trip could not be cancelled", HTTP_STATUS.BAD_REQUEST);
  }

  await bookingRepository.cancelPendingBookingsForTrip(tripId);

  return updated;
};

