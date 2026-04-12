import { BOOKING_STATUS } from "@/modules/booking/booking.constants";

/** Public filter values for GET /api/requests (mapped from Booking.status). */
export const REQUEST_QUERY_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type RequestQueryStatus = (typeof REQUEST_QUERY_STATUS)[keyof typeof REQUEST_QUERY_STATUS];

export const REQUEST_LIST_MAX_LIMIT = 100;
export const REQUEST_LIST_DEFAULT_LIMIT = 10;
export const REQUEST_LIST_DEFAULT_PAGE = 1;

/** Booking statuses when API filter is `pending` (awaiting rider accept). */
export const BOOKING_STATUSES_FOR_PENDING: readonly string[] = [BOOKING_STATUS.PENDING_RIDER_ACCEPT];

/** Booking statuses for `accepted` (rider accepted / paid / in-flight / delivered). */
export const BOOKING_STATUSES_FOR_ACCEPTED: readonly string[] = [
  BOOKING_STATUS.PENDING_PAYMENT,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PICKED_UP,
  BOOKING_STATUS.DELIVERED,
  BOOKING_STATUS.DISPUTED,
];

/** No first-class "rejected" on Booking; filter returns empty until a dedicated status exists. */
export const BOOKING_STATUSES_FOR_REJECTED: readonly string[] = [];

export const BOOKING_STATUS_CANCELLED = BOOKING_STATUS.CANCELLED;
