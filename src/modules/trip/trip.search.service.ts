import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import * as tripRepository from "@/modules/trip/trip.repository";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";
import type { TripLean } from "@/modules/trip/trip.repository";

const HANDLING_FEE_PERCENT = 5;
const PLATFORM_FEE_PERCENT = 10;

const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const capacityBadge = (maxWeight: number): string => {
  if (maxWeight < 150) return "<150 lbs";
  if (maxWeight < 300) return "<300 lbs";
  return `${Math.round(maxWeight)} lbs`;
};

export type SearchQuery = {
  fromLat: string;
  fromLng: string;
  toLat: string;
  toLng: string;
  travelDate: string;
  parcelWeight: string;
  parcelLength: string;
  parcelWidth: string;
  parcelHeight: string;
};

const parseNum = (v: string, name: string): number => {
  const n = parseFloat(v);
  if (Number.isNaN(n) || n < 0) {
    throw createError(`Invalid or negative ${name}`, HTTP_STATUS.BAD_REQUEST);
  }
  return n;
};

const parseCoord = (v: string, name: string): number => {
  const n = parseFloat(v);
  if (Number.isNaN(n)) {
    throw createError(`Invalid ${name}`, HTTP_STATUS.BAD_REQUEST);
  }
  return n;
};

const parseDate = (v: string): Date => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    throw createError("Invalid travelDate", HTTP_STATUS.BAD_REQUEST);
  }
  return d;
};

export const searchTrips = async (query: SearchQuery) => {
  const fromLat = parseCoord(query.fromLat, "fromLat");
  const fromLng = parseCoord(query.fromLng, "fromLng");
  const toLat = parseCoord(query.toLat, "toLat");
  const toLng = parseCoord(query.toLng, "toLng");
  if (fromLat < -90 || fromLat > 90 || fromLng < -180 || fromLng > 180) {
    throw createError("Invalid from coordinates", HTTP_STATUS.BAD_REQUEST);
  }
  if (toLat < -90 || toLat > 90 || toLng < -180 || toLng > 180) {
    throw createError("Invalid to coordinates", HTTP_STATUS.BAD_REQUEST);
  }
  const travelDate = parseDate(query.travelDate);
  if (travelDate.getTime() < Date.now()) {
    throw createError("Travel date must not be in the past", HTTP_STATUS.BAD_REQUEST);
  }
  const parcelWeight = parseNum(query.parcelWeight, "parcelWeight");
  const parcelLength = parseNum(query.parcelLength, "parcelLength");
  const parcelWidth = parseNum(query.parcelWidth, "parcelWidth");
  const parcelHeight = parseNum(query.parcelHeight, "parcelHeight");

  const trips = await tripRepository.searchPublished({
    fromLat,
    fromLng,
    toLat,
    toLng,
    travelDate,
    parcelWeight,
    parcelLength,
    parcelWidth,
    parcelHeight,
  });

  const list = (trips as (TripLean & { riderId?: { name?: string; phoneNumber?: string; countryCode?: string; _id?: unknown } })[]).map(
    (t) => ({
      tripId: (t._id as import("mongoose").Types.ObjectId).toString(),
      rider: t.riderId
        ? {
            name: (t.riderId as { name?: string }).name ?? "",
            phone: [((t.riderId as { countryCode?: string }).countryCode ?? ""), ((t.riderId as { phoneNumber?: string }).phoneNumber ?? "")].filter(Boolean).join(""),
          }
        : { name: "", phone: "" },
      rating: null as number | null,
      basePrice: t.price ?? 0,
      vehicleType: t.vehicleType ?? "standard",
      capacityBadge: t.remainingCapacity
        ? capacityBadge(t.remainingCapacity.maxWeight)
        : "N/A",
    })
  );
  return list;
};

export const getTripDetails = async (tripId: string) => {
  const trip = await tripRepository.findPublishedById(tripId);
  if (!trip) {
    const exists = await tripRepository.findById(tripId);
    if (!exists) {
      throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
    }
    throw createError("Trip is not published", HTTP_STATUS.BAD_REQUEST);
  }
  const t = trip as TripLean & { riderId?: { name?: string; phoneNumber?: string; countryCode?: string } };
  return {
    tripId: (t._id as import("mongoose").Types.ObjectId).toString(),
    route: {
      from: t.fromLocation,
      to: t.toLocation,
    },
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    travelDate: t.travelDate,
    basePrice: t.price ?? 0,
    riderProfile: t.riderId
      ? {
          name: (t.riderId as { name?: string }).name ?? "",
          phone: [((t.riderId as { countryCode?: string }).countryCode ?? ""), ((t.riderId as { phoneNumber?: string }).phoneNumber ?? "")].filter(Boolean).join(""),
        }
      : { name: "", phone: "" },
    vehicleType: t.vehicleType ?? "standard",
    capacity: t.capacity,
    remainingCapacity: t.remainingCapacity,
  };
};

export type PriceBreakdownQuery = {
  parcelWeight: string;
  parcelLength: string;
  parcelWidth: string;
  parcelHeight: string;
};

export const getPriceBreakdown = async (tripId: string, query: PriceBreakdownQuery) => {
  const trip = await tripRepository.findPublishedById(tripId);
  if (!trip) {
    const exists = await tripRepository.findById(tripId);
    if (!exists) throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
    throw createError("Trip is not published", HTTP_STATUS.BAD_REQUEST);
  }
  const parcelWeight = parseNum(query.parcelWeight, "parcelWeight");
  const parcelLength = parseNum(query.parcelLength, "parcelLength");
  const parcelWidth = parseNum(query.parcelWidth, "parcelWidth");
  const parcelHeight = parseNum(query.parcelHeight, "parcelHeight");

  const rem = trip.remainingCapacity;
  if (!rem || parcelWeight > rem.maxWeight || parcelLength > rem.maxLength || parcelWidth > rem.maxWidth || parcelHeight > rem.maxHeight) {
    throw createError("Parcel exceeds trip remaining capacity", HTTP_STATUS.BAD_REQUEST);
  }

  const basePrice = trip.price ?? 0;
  const handlingFee = Math.round((basePrice * HANDLING_FEE_PERCENT) / 100 * 100) / 100;
  const platformFee = Math.round((basePrice * PLATFORM_FEE_PERCENT) / 100 * 100) / 100;
  const totalPrice = Math.round((basePrice + handlingFee + platformFee) * 100) / 100;

  const from = trip.fromLocation;
  const to = trip.toLocation;
  const distanceKm =
    from && to ? haversineKm(from.lat, from.lng, to.lat, to.lng) : 0;

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    basePrice,
    handlingFee,
    platformFee,
    totalPrice,
  };
};

export const computeTotalPrice = (basePrice: number) => {
  const handlingFee = Math.round((basePrice * HANDLING_FEE_PERCENT) / 100 * 100) / 100;
  const platformFee = Math.round((basePrice * PLATFORM_FEE_PERCENT) / 100 * 100) / 100;
  return Math.round((basePrice + handlingFee + platformFee) * 100) / 100;
};
