import type { BookingLean } from "@/modules/booking/booking.repository";
import {
  BOOKING_STATUSES_FOR_ACCEPTED,
  BOOKING_STATUSES_FOR_PENDING,
  BOOKING_STATUS_CANCELLED,
  REQUEST_QUERY_STATUS,
} from "@/modules/request/request.constants";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import type { RequestListItem, TripLocationLean } from "@/modules/request/request.types";

const formatLocation = (loc: TripLocationLean | undefined): string => {
  if (!loc) return "Unknown";
  const addr = loc.address?.trim();
  if (addr) return addr.slice(0, 500);
  if (typeof loc.lat === "number" && typeof loc.lng === "number") {
    return `${loc.lat},${loc.lng}`;
  }
  return "Unknown";
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

type BookingWithTrip = BookingLean & {
  tripId?: {
    _id: import("mongoose").Types.ObjectId;
    riderId?: import("mongoose").Types.ObjectId;
    fromLocation?: TripLocationLean;
    toLocation?: TripLocationLean;
  } | null;
};

export const mapBookingToRequestListItem = (b: BookingWithTrip): RequestListItem => {
  const trip = b.tripId;
  const pickup = formatLocation(trip?.fromLocation);
  const drop = formatLocation(trip?.toLocation);
  const id = b._id.toString();
  return {
    requestId: `REQ-${id.slice(-8).toUpperCase()}`,
    bookingId: id,
    status: bookingToPublicRequestStatus(b.status),
    pickupLocation: pickup,
    dropLocation: drop,
    createdAt: b.createdAt.toISOString(),
  };
};
