import { getStripeClient } from "@/services/stripe/stripe.client";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { getOrCreateStripeCustomerIdForUser } from "@/modules/payments/payment.service";
import * as bookingRepository from "@/modules/booking/booking.repository";
import Trip from "@/modules/trip/trip.model";
import { BOOKING_STATUS, MIN_PACKAGE_IMAGES } from "@/modules/booking/booking.constants";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";
import type { BookingLean } from "@/modules/booking/booking.repository";
import { env } from "@/config/env.config";
import { dollarsToStripeAmount } from "@/modules/booking/booking.stripe.utils";

export const validateBookingReadyForPayment = async (
  bookingId: string,
  senderId: string
): Promise<{ booking: BookingLean }> => {
  const booking = await bookingRepository.findByIdWithSender(bookingId, senderId);
  if (!booking) {
    throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  }
  if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw createError("Booking already confirmed (double payment)", HTTP_STATUS.BAD_REQUEST);
    }
    throw createError(
      `Booking cannot be paid. Current status: ${booking.status}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (booking.agreedPrice <= 0) {
    throw createError("Invalid booking price", HTTP_STATUS.BAD_REQUEST);
  }
  if (!booking.packageImages || booking.packageImages.length < MIN_PACKAGE_IMAGES) {
    throw createError(
      `At least ${MIN_PACKAGE_IMAGES} package images required`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const trip = await Trip.findById(booking.tripId).exec();
  if (!trip || trip.status !== TRIP_STATUS.PUBLISHED) {
    throw createError("Trip no longer available or cancelled", HTTP_STATUS.BAD_REQUEST);
  }
  const rem = trip.remainingCapacity;
  if (!rem || rem.maxWeight < booking.parcel.weight) {
    throw createError("Insufficient remaining capacity", HTTP_STATUS.BAD_REQUEST);
  }

  return { booking };
};

export const createBookingPaymentIntent = async (
  bookingId: string,
  senderId: string,
  paymentMethodId?: string
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  const { booking } = await validateBookingReadyForPayment(bookingId, senderId);

  const customerId = await getOrCreateStripeCustomerIdForUser(senderId);
  const stripe = getStripeClient();

  try {
    const pi = await stripe.paymentIntents.create({
      amount: dollarsToStripeAmount(booking.agreedPrice),
      currency: env.STRIPE_CURRENCY,
      customer: customerId,
      ...(paymentMethodId
        ? { payment_method: paymentMethodId }
        : { automatic_payment_methods: { enabled: true } }),
      metadata: {
        bookingId: booking._id.toString(),
        senderId,
      },
    });

    if (!pi.client_secret) {
      throw createError("Failed to create payment intent", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode) {
      throw err;
    }
    throw createError(
      "Stripe API error while creating payment intent",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};
