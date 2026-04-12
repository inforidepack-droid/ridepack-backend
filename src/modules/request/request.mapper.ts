import { Types } from "mongoose";
import type { BookingLean } from "@/modules/booking/booking.repository";
import {
  BOOKING_STATUSES_FOR_ACCEPTED,
  BOOKING_STATUSES_FOR_PENDING,
  REQUEST_QUERY_STATUS,
} from "@/modules/request/request.constants";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import type {
  RequestListItem,
  RequestLocationDetail,
  RequestRiderSummary,
  RequestTripCapacity,
  RequestTripDetail,
  TripLocationLean,
} from "@/modules/request/request.types";

const formatLocation = (loc: TripLocationLean | undefined): string => {
  if (!loc) return "Unknown";
  const addr = loc.address?.trim();
  if (addr) return addr.slice(0, 500);
  if (typeof loc.lat === "number" && typeof loc.lng === "number") {
    return `${loc.lat},${loc.lng}`;
  }
  return "Unknown";
};

const toLocationDetail = (loc: TripLocationLean | undefined): RequestLocationDetail | null => {
  if (!loc) return null;
  const out: RequestLocationDetail = {
    ...(typeof loc.lat === "number" ? { lat: loc.lat } : {}),
    ...(typeof loc.lng === "number" ? { lng: loc.lng } : {}),
    ...(loc.address ? { address: loc.address } : {}),
  };
  return Object.keys(out).length > 0 ? out : null;
};

const toIso = (d: Date | string | undefined | null): string | undefined => {
  if (d == null) return undefined;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString();
};

const bookingToPublicRequestStatus = (bookingStatus: string): string => {
  if (bookingStatus === BOOKING_STATUS.CANCELLED) return REQUEST_QUERY_STATUS.CANCELLED;
  if ((BOOKING_STATUSES_FOR_ACCEPTED as readonly string[]).includes(bookingStatus)) {
    return REQUEST_QUERY_STATUS.ACCEPTED;
  }
  if ((BOOKING_STATUSES_FOR_PENDING as readonly string[]).includes(bookingStatus)) {
    return REQUEST_QUERY_STATUS.PENDING;
  }
  return REQUEST_QUERY_STATUS.PENDING;
};

type RiderLean = {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  name?: string;
  profileImage?: string;
  ratingAverage?: number;
  ratingCount?: number;
  phoneNumber?: string;
  countryCode?: string;
};

type TripLean = {
  _id: Types.ObjectId;
  riderId?: Types.ObjectId | RiderLean | null;
  fromLocation?: TripLocationLean;
  toLocation?: TripLocationLean;
  status?: string;
  travelDate?: Date;
  departureTime?: string;
  arrivalTime?: string;
  capacity?: RequestTripCapacity;
  remainingCapacity?: RequestTripCapacity;
  price?: number;
  vehicleType?: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

type BookingWithTrip = BookingLean & {
  tripId?: TripLean | Types.ObjectId | null;
};

const mapCapacity = (c: RequestTripCapacity | undefined): RequestTripCapacity | null =>
  c
    ? {
        maxWeight: c.maxWeight,
        maxLength: c.maxLength,
        maxWidth: c.maxWidth,
        maxHeight: c.maxHeight,
      }
    : null;

const mapRider = (riderId: Types.ObjectId | RiderLean | null | undefined): RequestRiderSummary | null => {
  if (!riderId) return null;
  if (riderId instanceof Types.ObjectId) return null;
  if (typeof riderId !== "object" || !("_id" in riderId)) return null;
  const r = riderId as RiderLean;
  return {
    userId: r._id.toString(),
    ...(r.name !== undefined ? { name: r.name } : {}),
    ...(r.firstName !== undefined ? { firstName: r.firstName } : {}),
    ...(r.lastName !== undefined ? { lastName: r.lastName } : {}),
    ...(r.profileImage !== undefined ? { profileImage: r.profileImage } : {}),
    ...(typeof r.ratingAverage === "number" ? { ratingAverage: r.ratingAverage } : {}),
    ...(typeof r.ratingCount === "number" ? { ratingCount: r.ratingCount } : {}),
    ...(r.phoneNumber !== undefined ? { phoneNumber: r.phoneNumber } : {}),
    ...(r.countryCode !== undefined ? { countryCode: r.countryCode } : {}),
  };
};

const mapTrip = (tripId: BookingWithTrip["tripId"]): RequestTripDetail | null => {
  if (!tripId || typeof tripId !== "object" || !("_id" in tripId)) return null;
  const t = tripId as TripLean;
  const pickup = toLocationDetail(t.fromLocation);
  const dropoff = toLocationDetail(t.toLocation);
  const travelDate = toIso(t.travelDate ?? null);
  const publishedAt = toIso(t.publishedAt ?? null);
  const tripCreatedAt = toIso(t.createdAt ?? null);
  const tripUpdatedAt = toIso(t.updatedAt ?? null);
  return {
    tripId: t._id.toString(),
    ...(t.status !== undefined ? { status: t.status } : {}),
    ...(travelDate !== undefined ? { travelDate } : {}),
    ...(t.departureTime !== undefined ? { departureTime: t.departureTime } : {}),
    ...(t.arrivalTime !== undefined ? { arrivalTime: t.arrivalTime } : {}),
    ...(typeof t.price === "number" ? { price: t.price } : {}),
    ...(t.vehicleType !== undefined ? { vehicleType: t.vehicleType } : {}),
    capacity: mapCapacity(t.capacity),
    remainingCapacity: mapCapacity(t.remainingCapacity),
    ...(publishedAt !== undefined ? { publishedAt } : {}),
    ...(tripCreatedAt !== undefined ? { createdAt: tripCreatedAt } : {}),
    ...(tripUpdatedAt !== undefined ? { updatedAt: tripUpdatedAt } : {}),
    pickup,
    dropoff,
    rider: mapRider(t.riderId),
  };
};

export const mapBookingToRequestListItem = (b: BookingWithTrip): RequestListItem => {
  const trip = b.tripId && typeof b.tripId === "object" && "_id" in b.tripId ? (b.tripId as TripLean) : null;
  const pickupLoc = trip?.fromLocation;
  const dropLoc = trip?.toLocation;
  const pickup = formatLocation(pickupLoc);
  const drop = formatLocation(dropLoc);
  const id = b._id.toString();
  const parcel = { ...b.parcel };
  const senderDetails = { ...b.senderDetails };
  const receiverDetails = { ...b.receiverDetails };
  const packageImages = [...b.packageImages];
  return {
    requestId: `REQ-${id.slice(-8).toUpperCase()}`,
    bookingId: id,
    status: bookingToPublicRequestStatus(b.status),
    bookingStatus: b.status,
    pickupLocation: pickup,
    dropLocation: drop,
    pickup: toLocationDetail(pickupLoc),
    dropoff: toLocationDetail(dropLoc),
    parcel,
    senderDetails,
    receiverDetails,
    packageImages,
    agreedPrice: b.agreedPrice,
    illegalItemsDeclaration: b.illegalItemsDeclaration,
    ...(b.paymentTransactionId !== undefined
      ? { paymentTransactionId: b.paymentTransactionId }
      : {}),
    ...(typeof b.escrowAmount === "number" ? { escrowAmount: b.escrowAmount } : {}),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    trip: mapTrip(b.tripId),
  };
};
