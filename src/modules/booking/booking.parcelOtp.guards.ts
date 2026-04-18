import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import { HTTP_STATUS } from "@/constants/http.constants";
import { createError } from "@/utils/appError";

export const assertBookingNotCancelledOrDisputed = (status: string): void => {
  if (status === BOOKING_STATUS.CANCELLED) {
    throw createError("Booking is cancelled", HTTP_STATUS.BAD_REQUEST);
  }
  if (status === BOOKING_STATUS.DISPUTED) {
    throw createError("Booking is in dispute; OTP verification is blocked", HTTP_STATUS.BAD_REQUEST);
  }
};

/** Pickup OTP allowed only in CONFIRMED (paid, not yet picked up). */
export const assertPickupOtpBookingStatus = (status: string): void => {
  assertBookingNotCancelledOrDisputed(status);
  if (status === BOOKING_STATUS.PICKED_UP) {
    throw createError("Pickup already verified", HTTP_STATUS.BAD_REQUEST);
  }
  if (status === BOOKING_STATUS.DELIVERED) {
    throw createError("Booking is already delivered", HTTP_STATUS.BAD_REQUEST);
  }
  if (status !== BOOKING_STATUS.CONFIRMED) {
    throw createError(
      "Pickup can only be verified when booking is confirmed (paid)",
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

/** Delivery OTP allowed only in PICKED_UP (in transit). */
export const assertDeliveryOtpBookingStatus = (status: string): void => {
  assertBookingNotCancelledOrDisputed(status);
  if (status === BOOKING_STATUS.DELIVERED) {
    throw createError("Delivery already verified", HTTP_STATUS.BAD_REQUEST);
  }
  if (status !== BOOKING_STATUS.PICKED_UP) {
    throw createError(
      "Booking must be picked up before delivery verification",
      HTTP_STATUS.BAD_REQUEST
    );
  }
};
