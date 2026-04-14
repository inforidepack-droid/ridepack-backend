import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import Booking from "@/modules/booking/booking.model";
import Trip from "@/modules/trip/trip.model";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import {
  emitDeliveryArrived,
  emitPickupArrived,
} from "@/events/notification.emitters";

const assertRider = async (bookingId: string, riderId: string): Promise<void> => {
  const booking = await Booking.findById(bookingId).select("tripId").lean().exec();
  if (!booking) throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  const trip = await Trip.findById(booking.tripId).select("riderId").lean().exec();
  if (!trip) throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
  const rid = (trip.riderId as mongoose.Types.ObjectId).toString();
  if (rid !== riderId) {
    throw createError("Only the trip rider can notify arrival", HTTP_STATUS.FORBIDDEN);
  }
};

export const riderNotifyPickupArrival = async (
  bookingId: string,
  riderId: string
): Promise<{ ok: true }> => {
  await assertRider(bookingId, riderId);
  const updated = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: BOOKING_STATUS.CONFIRMED,
      pickupArrivalNotified: { $ne: true },
    },
    { $set: { pickupArrivalNotified: true } },
    { new: true }
  )
    .lean()
    .exec();
  if (!updated) {
    throw createError(
      "Pickup arrival already notified or booking is not confirmed",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  const senderId = (updated.senderId as mongoose.Types.ObjectId).toString();
  emitPickupArrived({ bookingId, senderId });
  return { ok: true };
};

export const riderNotifyDeliveryArrival = async (
  bookingId: string,
  riderId: string
): Promise<{ ok: true }> => {
  await assertRider(bookingId, riderId);
  const updated = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: BOOKING_STATUS.PICKED_UP,
      deliveryArrivalNotified: { $ne: true },
    },
    { $set: { deliveryArrivalNotified: true } },
    { new: true }
  )
    .lean()
    .exec();
  if (!updated) {
    throw createError(
      "Delivery arrival already notified or booking is not picked up",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  emitDeliveryArrived({ bookingId });
  return { ok: true };
};
