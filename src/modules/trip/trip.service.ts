import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import * as tripRepository from "@/modules/trip/trip.repository";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";
import type { ITrip } from "@/modules/trip/trip.model";
import type { TripLean } from "@/modules/trip/trip.repository";

const hasLatLng = (loc: { lat?: number; lng?: number } | null | undefined): boolean =>
  Boolean(loc && typeof loc.lat === "number" && typeof loc.lng === "number");

const isFutureDate = (d: Date | string | undefined): boolean => {
  if (!d) return false;
  const date = typeof d === "string" ? new Date(d) : d;
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
};

const isPositive = (n: number | undefined): boolean =>
  typeof n === "number" && n > 0 && Number.isFinite(n);

const isCapacityValid = (c: TripLean["capacity"]): boolean =>
  Boolean(
    c &&
      isPositive(c.maxWeight) &&
      isPositive(c.maxLength) &&
      isPositive(c.maxWidth) &&
      isPositive(c.maxHeight)
  );

const complianceAllTrue = (t: TripLean): boolean =>
  Boolean(
    t.legalItemConfirmed === true &&
      t.fitsLuggageConfirmed === true &&
      t.willNotOpenConfirmed === true &&
      t.willMeetReceiverConfirmed === true
  );

const parseTimeToMinutes = (timeStr: string | undefined): number | null => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const arrivalAfterDeparture = (t: TripLean): boolean => {
  const dep = parseTimeToMinutes(t.departureTime);
  const arr = parseTimeToMinutes(t.arrivalTime);
  if (dep === null || arr === null) return false;
  return arr > dep;
};

const sameSourceDest = (t: TripLean): boolean => {
  const from = t.fromLocation;
  const to = t.toLocation;
  if (!from || !to) return false;
  const tol = 1e-9;
  return (
    Math.abs((from.lat ?? 0) - (to.lat ?? 0)) < tol &&
    Math.abs((from.lng ?? 0) - (to.lng ?? 0)) < tol
  );
};

export const validateTripForPublish = (trip: TripLean | null): void => {
  if (!trip) throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);

  if (trip.status !== TRIP_STATUS.DRAFT) {
    if (trip.status === TRIP_STATUS.PUBLISHED) {
      throw createError("Trip is already published", HTTP_STATUS.BAD_REQUEST);
    }
    if (trip.status === TRIP_STATUS.CANCELLED) {
      throw createError("Cannot publish a cancelled trip", HTTP_STATUS.BAD_REQUEST);
    }
    throw createError(
      `Trip cannot be published from status: ${trip.status}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!hasLatLng(trip.fromLocation)) {
    throw createError("fromLocation with lat and lng is required", HTTP_STATUS.BAD_REQUEST);
  }
  if (!hasLatLng(trip.toLocation)) {
    throw createError("toLocation with lat and lng is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (sameSourceDest(trip)) {
    throw createError("Source and destination cannot be the same", HTTP_STATUS.BAD_REQUEST);
  }

  if (!trip.travelDate) {
    throw createError("travelDate is required", HTTP_STATUS.BAD_REQUEST);
  }
  if (!isFutureDate(trip.travelDate)) {
    throw createError("Travel date must be in the future", HTTP_STATUS.BAD_REQUEST);
  }

  if (!trip.departureTime) {
    throw createError("departureTime is required", HTTP_STATUS.BAD_REQUEST);
  }
  if (!trip.arrivalTime) {
    throw createError("arrivalTime is required", HTTP_STATUS.BAD_REQUEST);
  }
  if (!arrivalAfterDeparture(trip)) {
    throw createError("Arrival time must be after departure time", HTTP_STATUS.BAD_REQUEST);
  }

  if (!isCapacityValid(trip.capacity)) {
    throw createError(
      "capacity.maxWeight, maxLength, maxWidth, maxHeight must all be greater than 0",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!isPositive(trip.price)) {
    throw createError("price must be greater than 0", HTTP_STATUS.BAD_REQUEST);
  }

  if (!complianceAllTrue(trip)) {
    throw createError(
      "All compliance confirmations (legalItemConfirmed, fitsLuggageConfirmed, willNotOpenConfirmed, willMeetReceiverConfirmed) must be true",
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

export const publishTrip = async (
  tripId: string,
  riderId: string
): Promise<ITrip> => {
  const trip = await tripRepository.findByIdWithRider(tripId, riderId);

  if (!trip) {
    const exists = await tripRepository.findById(tripId);
    if (!exists) {
      throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
    }
    throw createError("Only the trip owner can publish this trip", HTTP_STATUS.FORBIDDEN);
  }

  validateTripForPublish(trip as TripLean);

  const capacity = trip.capacity;
  if (!capacity) throw createError("Trip capacity is missing", HTTP_STATUS.BAD_REQUEST);

  const remainingCapacity = {
    maxWeight: capacity.maxWeight,
    maxLength: capacity.maxLength,
    maxWidth: capacity.maxWidth,
    maxHeight: capacity.maxHeight,
  };

  const updated = await tripRepository.atomicPublish(
    tripId,
    riderId,
    remainingCapacity
  );

  if (!updated) {
    throw createError(
      "Trip could not be published. It may have been modified or already published.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return updated as ITrip;
};

export type CreateDraftInput = tripRepository.CreateDraftInput;

export const createDraftTrip = async (
  riderId: string,
  data: CreateDraftInput
): Promise<TripLean> => tripRepository.createDraft(riderId, data);
