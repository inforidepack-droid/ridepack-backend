export const BOOKING_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  CONFIRMED: "confirmed",
  PICKED_UP: "picked_up",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const MIN_PACKAGE_IMAGES = 3;
