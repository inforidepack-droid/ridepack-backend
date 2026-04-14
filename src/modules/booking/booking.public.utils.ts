import type { BookingLean } from "@/modules/booking/booking.repository";

/** Removes secrets before sending a booking in API responses. */
export const toPublicBookingLean = (b: BookingLean): BookingLean => {
  const { deliveryOtp: _, ...rest } = b as BookingLean & { deliveryOtp?: string };
  return rest as BookingLean;
};
