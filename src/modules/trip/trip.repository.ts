import mongoose from "mongoose";
import Trip, { ITrip } from "@/modules/trip/trip.model";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";
import type { ICapacity, ILocation } from "@/modules/trip/trip.types";

export type TripLean = Omit<ITrip, keyof import("mongoose").Document> & { _id: import("mongoose").Types.ObjectId };

export type CreateDraftInput = {
  fromLocation: ILocation;
  toLocation: ILocation;
  travelDate: Date;
  departureTime: string;
  arrivalTime: string;
  capacity: ICapacity;
  price: number;
  legalItemConfirmed: boolean;
  fitsLuggageConfirmed: boolean;
  willNotOpenConfirmed: boolean;
  willMeetReceiverConfirmed: boolean;
};

export const createDraft = (
  riderId: string,
  data: CreateDraftInput
): Promise<TripLean> =>
  Trip.create({
    riderId: new mongoose.Types.ObjectId(riderId),
    status: TRIP_STATUS.DRAFT,
    ...data,
  }).then((doc) => doc.toObject() as TripLean);

export const findById = (tripId: string): Promise<TripLean | null> =>
  Trip.findById(tripId).lean().exec() as Promise<TripLean | null>;

export type SearchFilters = {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  travelDate: Date;
  parcelWeight: number;
  parcelLength: number;
  parcelWidth: number;
  parcelHeight: number;
};

const LOCATION_DELTA = 0.03;

export const searchPublished = async (
  filters: SearchFilters
): Promise<TripLean[]> => {
  const startOfDay = new Date(filters.travelDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(filters.travelDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const trips = await Trip.find({
    status: TRIP_STATUS.PUBLISHED,
    travelDate: { $gte: startOfDay, $lte: endOfDay },
    "fromLocation.lat": { $gte: filters.fromLat - LOCATION_DELTA, $lte: filters.fromLat + LOCATION_DELTA },
    "fromLocation.lng": { $gte: filters.fromLng - LOCATION_DELTA, $lte: filters.fromLng + LOCATION_DELTA },
    "toLocation.lat": { $gte: filters.toLat - LOCATION_DELTA, $lte: filters.toLat + LOCATION_DELTA },
    "toLocation.lng": { $gte: filters.toLng - LOCATION_DELTA, $lte: filters.toLng + LOCATION_DELTA },
    "remainingCapacity.maxWeight": { $gte: filters.parcelWeight },
    "remainingCapacity.maxLength": { $gte: filters.parcelLength },
    "remainingCapacity.maxWidth": { $gte: filters.parcelWidth },
    "remainingCapacity.maxHeight": { $gte: filters.parcelHeight },
  })
    .populate("riderId", "name phoneNumber countryCode isPhoneVerified isBlocked")
    .lean()
    .exec();

  const filtered = (trips as (TripLean & { riderId?: { isBlocked?: boolean; isPhoneVerified?: boolean } })[]).filter(
    (t) =>
      t.riderId &&
      !(t.riderId as { isBlocked?: boolean }).isBlocked &&
      (t.riderId as { isPhoneVerified?: boolean }).isPhoneVerified === true
  );

  return filtered as TripLean[];
};

export const findPublishedById = (tripId: string): Promise<TripLean | null> =>
  Trip.findOne({ _id: tripId, status: TRIP_STATUS.PUBLISHED })
    .populate("riderId", "name phoneNumber countryCode")
    .lean()
    .exec() as Promise<TripLean | null>;

export const findByIdWithRider = (
  tripId: string,
  riderId: string
): Promise<TripLean | null> =>
  Trip.findOne({ _id: tripId, riderId }).lean().exec() as Promise<TripLean | null>;

/**
 * Atomic publish: only updates if status is draft. Returns updated trip or null.
 */
export const atomicPublish = (
  tripId: string,
  riderId: string,
  remainingCapacity: ICapacity
): Promise<TripLean | null> =>
  Trip.findOneAndUpdate(
    { _id: tripId, riderId, status: TRIP_STATUS.DRAFT },
    {
      $set: {
        status: TRIP_STATUS.PUBLISHED,
        remainingCapacity,
        publishedAt: new Date(),
        isLocked: true,
      },
    },
    { new: true }
  )
    .lean()
    .exec() as Promise<TripLean | null>;

export const findPublishedByRiderId = (riderId: string): Promise<TripLean[]> =>
  Trip.find({
    riderId: new mongoose.Types.ObjectId(riderId),
    status: TRIP_STATUS.PUBLISHED,
  })
    .populate("riderId", "name email profileImage phoneNumber countryCode")
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean()
    .exec() as Promise<TripLean[]>;

export const atomicCancel = (tripId: string, riderId: string): Promise<TripLean | null> =>
  Trip.findOneAndUpdate(
    {
      _id: tripId,
      riderId,
      status: { $in: [TRIP_STATUS.DRAFT, TRIP_STATUS.PUBLISHED] },
    },
    {
      $set: {
        status: TRIP_STATUS.CANCELLED,
        isLocked: false,
      },
    },
    { new: true }
  )
    .lean()
    .exec() as Promise<TripLean | null>;
