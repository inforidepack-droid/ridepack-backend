import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import Booking from "@/modules/booking/booking.model";
import Trip from "@/modules/trip/trip.model";
import User from "@/modules/auth/models/User.model";
import RiderLocation from "@/modules/tracking/riderLocation.model";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import { RIDER_OFFLINE_THRESHOLD_MS } from "@/modules/tracking/tracking.constants";
import type { TrackingResponse } from "@/modules/tracking/tracking.types";
import type { ILocation } from "@/modules/trip/trip.types";
import { getEtaAndDistance } from "@/modules/tracking/eta.service";

const locationToCoords = (loc: ILocation | null | undefined): { lat: number; lng: number; address?: string } | null => {
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return null;
  return { lat: loc.lat, lng: loc.lng, address: loc.address };
};

export const getParcelTracking = async (
  parcelId: string,
  userId: string
): Promise<TrackingResponse> => {
  if (!mongoose.Types.ObjectId.isValid(parcelId)) {
    throw createError("Invalid parcel id", HTTP_STATUS.BAD_REQUEST);
  }

  const booking = await Booking.findById(parcelId)
    .populate("tripId", "riderId fromLocation toLocation")
    .lean()
    .exec();

  if (!booking) {
    throw createError("Parcel not found", HTTP_STATUS.NOT_FOUND);
  }

  const trip = booking.tripId as unknown as { riderId: mongoose.Types.ObjectId; fromLocation?: ILocation; toLocation?: ILocation } | null;
  if (!trip) {
    throw createError("Trip not found for this parcel", HTTP_STATUS.NOT_FOUND);
  }

  const riderIdStr = (trip.riderId as mongoose.Types.ObjectId).toString();
  const senderIdStr = (booking.senderId as mongoose.Types.ObjectId).toString();

  const isSender = userId === senderIdStr;
  const isRider = userId === riderIdStr;
  if (!isSender && !isRider) {
    throw createError("You are not authorized to track this parcel", HTTP_STATUS.FORBIDDEN);
  }

  const pickup = locationToCoords(trip.fromLocation);
  const drop = locationToCoords(trip.toLocation);

  if (!pickup || !drop) {
    throw createError("Pickup or drop location is missing for this parcel", HTTP_STATUS.BAD_REQUEST);
  }

  if (booking.status === BOOKING_STATUS.DELIVERED) {
    const rider = await User.findById(riderIdStr).select("name phoneNumber countryCode").lean().exec();
    return {
      parcelId,
      status: BOOKING_STATUS.DELIVERED,
      pickup,
      drop,
      currentRiderLocation: null,
      etaMinutes: null,
      distanceRemainingKm: null,
      riderDetails: rider
        ? { name: rider.name, phoneNumber: rider.phoneNumber, countryCode: rider.countryCode }
        : null,
      isRiderOffline: false,
    };
  }

  if (booking.status !== BOOKING_STATUS.PICKED_UP && booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw createError(
      "Parcel not picked up yet. Tracking is available after the rider picks up the parcel.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const riderLocationDoc = await RiderLocation.findOne({ riderId: trip.riderId }).lean().exec();
  const now = Date.now();
  const lastUpdate = riderLocationDoc?.updatedAt ? new Date(riderLocationDoc.updatedAt).getTime() : 0;
  const isRiderOffline = !riderLocationDoc || now - lastUpdate > RIDER_OFFLINE_THRESHOLD_MS;

  let currentRiderLocation: { lat: number; lng: number; address?: string } | null = null;
  let etaMinutes: number | null = null;
  let distanceRemainingKm: number | null = null;

  if (riderLocationDoc && typeof riderLocationDoc.lat === "number" && typeof riderLocationDoc.lng === "number") {
    currentRiderLocation = {
      lat: riderLocationDoc.lat,
      lng: riderLocationDoc.lng,
    };
    const etaResult = await getEtaAndDistance(
      riderLocationDoc.lat,
      riderLocationDoc.lng,
      drop.lat,
      drop.lng
    );
    etaMinutes = etaResult.etaMinutes;
    distanceRemainingKm = etaResult.distanceKm;
  }

  const rider = await User.findById(riderIdStr).select("name phoneNumber countryCode").lean().exec();

  return {
    parcelId,
    status: booking.status,
    pickup,
    drop,
    currentRiderLocation,
    etaMinutes,
    distanceRemainingKm,
    riderDetails: rider
      ? { name: rider.name, phoneNumber: rider.phoneNumber, countryCode: rider.countryCode }
      : null,
    isRiderOffline,
  };
};
