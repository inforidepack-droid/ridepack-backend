import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import * as bookingRepository from "@/modules/booking/booking.repository";
import * as tripRepository from "@/modules/trip/trip.repository";
import { computeTotalPrice } from "@/modules/trip/trip.search.service";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";
import { BOOKING_STATUS, MIN_PACKAGE_IMAGES } from "@/modules/booking/booking.constants";
import Trip from "@/modules/trip/trip.model";
import User from "@/modules/auth/models/User.model";
import Transaction from "@/modules/booking/transaction.model";
import { ensureUserVerificationApprovedForBooking } from "@/modules/verification/verification.service";
import { validateBookingReadyForPayment } from "@/modules/booking/booking.payment.service";
import { assertPaymentIntentMatchesBooking } from "@/modules/booking/booking.stripe.utils";
import { env } from "@/config/env.config";
import { generateDeliveryOtp } from "@/utils/otp.generate.utils";
import {
  DEV_STATIC_DELIVERY_OTP,
} from "@/modules/booking/booking.parcelOtp.constants";
import { sendParcelDeliveryOtpSms } from "@/modules/booking/booking.parcelOtp.twilio";
import { toPublicBookingLean } from "@/modules/booking/booking.public.utils";
import {
  emitBookingCreated,
  emitPaymentSucceeded,
  emitRequestAccepted,
} from "@/events/notification.emitters";

export type CreateBookingBody = {
  tripId: string;
  parcel: { weight: number; length: number; width: number; height: number; description?: string };
  senderDetails: { name: string; phone: string };
  receiverDetails: { name: string; phone: string; countryCode?: string };
  packageImages: string[];
  agreedPrice: number;
  illegalItemsDeclaration: boolean;
};

const parcelFits = (
  parcel: CreateBookingBody["parcel"],
  rem: { maxWeight: number; maxLength: number; maxWidth: number; maxHeight: number }
): boolean =>
  parcel.weight <= rem.maxWeight &&
  parcel.length <= rem.maxLength &&
  parcel.width <= rem.maxWidth &&
  parcel.height <= rem.maxHeight;

export const createBooking = async (
  senderId: string,
  body: CreateBookingBody
): Promise<bookingRepository.BookingLean> => {
  const { tripId, parcel, senderDetails, receiverDetails, packageImages, agreedPrice } = body;

  if (!packageImages || packageImages.length < MIN_PACKAGE_IMAGES) {
    throw createError(
      `At least ${MIN_PACKAGE_IMAGES} package images are required`,
      HTTP_STATUS.BAD_REQUEST
    );
  }
  if (!senderDetails?.name?.trim() || !senderDetails?.phone?.trim()) {
    throw createError("Sender name and phone are required", HTTP_STATUS.BAD_REQUEST);
  }
  if (!receiverDetails?.name?.trim() || !receiverDetails?.phone?.trim()) {
    throw createError("Receiver name and phone are required", HTTP_STATUS.BAD_REQUEST);
  }
  if (
    parcel.weight <= 0 ||
    parcel.length <= 0 ||
    parcel.width <= 0 ||
    parcel.height <= 0
  ) {
    throw createError("Parcel dimensions and weight must be positive", HTTP_STATUS.BAD_REQUEST);
  }
  if (agreedPrice <= 0) {
    throw createError("Agreed price must be positive", HTTP_STATUS.BAD_REQUEST);
  }

  if (!body.illegalItemsDeclaration) {
    throw createError(
      "Sender must confirm that the parcel does not contain illegal items",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const trip = await tripRepository.findById(tripId);
  if (!trip) {
    throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
  }
  if (trip.status !== TRIP_STATUS.PUBLISHED) {
    throw createError("Trip is not published", HTTP_STATUS.BAD_REQUEST);
  }

  const riderId = (trip.riderId as unknown as mongoose.Types.ObjectId).toString();
  if (riderId === senderId) {
    throw createError("Sender cannot book own trip", HTTP_STATUS.BAD_REQUEST);
  }

  const sender = await User.findById(senderId).select("isBlocked verification").lean().exec();
  if (!sender) {
    throw createError("Sender account not found", HTTP_STATUS.NOT_FOUND);
  }
  if ((sender as { isBlocked?: boolean }).isBlocked) {
    throw createError("Sender account is blocked", HTTP_STATUS.FORBIDDEN);
  }

  await ensureUserVerificationApprovedForBooking(senderId);

  const remaining = trip.remainingCapacity;
  if (!remaining) {
    throw createError("Trip has no remaining capacity", HTTP_STATUS.BAD_REQUEST);
  }
  if (!parcelFits(parcel, remaining)) {
    throw createError("Parcel exceeds trip remaining capacity", HTTP_STATUS.BAD_REQUEST);
  }

  const travelDate = trip.travelDate ? new Date(trip.travelDate) : null;
  if (travelDate && travelDate.getTime() < Date.now()) {
    throw createError("Travel date is in the past", HTTP_STATUS.BAD_REQUEST);
  }

  const serverTotal = computeTotalPrice(trip.price ?? 0);
  if (Math.abs(agreedPrice - serverTotal) > 0.01) {
    throw createError(
      `Price mismatch. Server calculated total: ${serverTotal}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const deliveryOtp =
    env.NODE_ENV === "development" ? DEV_STATIC_DELIVERY_OTP : generateDeliveryOtp();
  const booking = await bookingRepository.create({
    tripId,
    senderId,
    parcel,
    senderDetails,
    receiverDetails,
    packageImages,
    agreedPrice,
    illegalItemsDeclaration: body.illegalItemsDeclaration,
    deliveryOtp,
  });

  if (env.NODE_ENV !== "development") {
    try {
      await sendParcelDeliveryOtpSms(
        {
          phone: receiverDetails.phone,
          countryCode: receiverDetails.countryCode,
        },
        deliveryOtp
      );
    } catch (e) {
      await bookingRepository.deleteById(booking._id.toString());
      const invalid = e instanceof Error && e.message === "INVALID_RECEIVER_PHONE";
      if (invalid) {
        throw createError(
          "Receiver phone is invalid or not supported for SMS (+1 / +91; use E.164 or countryCode + national digits)",
          HTTP_STATUS.BAD_REQUEST
        );
      }
      throw createError("Failed to send delivery OTP via SMS", HTTP_STATUS.BAD_GATEWAY);
    }
  }

  const publicBooking = toPublicBookingLean(booking);
  emitBookingCreated({
    riderId,
    bookingId: booking._id.toString(),
  });
  return publicBooking;
};

export const acceptBookingRequest = async (
  riderId: string,
  bookingId: string
): Promise<bookingRepository.BookingLean> => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) {
    throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  }
  // if (booking.status !== BOOKING_STATUS.PENDING_RIDER_ACCEPT) {
  //   throw createError(
  //     `Booking cannot be accepted. Current status: ${booking.status}`,
  //     HTTP_STATUS.BAD_REQUEST
  //   );
  // }

  const trip = await tripRepository.findById((booking.tripId as unknown as mongoose.Types.ObjectId).toString());
  if (!trip) {
    throw createError("Trip not found", HTTP_STATUS.NOT_FOUND);
  }
  const tripRiderId = (trip.riderId as unknown as mongoose.Types.ObjectId).toString();
  if (tripRiderId !== riderId) {
    throw createError("Only the trip rider can accept this booking request", HTTP_STATUS.FORBIDDEN);
  }
  if (trip.status !== TRIP_STATUS.PUBLISHED) {
    throw createError("Trip is not published", HTTP_STATUS.BAD_REQUEST);
  }

  const remaining = trip.remainingCapacity;
  if (!remaining || booking.parcel.weight > remaining.maxWeight) {
    throw createError("Insufficient remaining capacity for this parcel", HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await bookingRepository.updateStatus(bookingId, BOOKING_STATUS.CONFIRMED);
  if (!updated) {
    throw createError("Failed to accept booking", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  const senderIdStr = (updated.senderId as unknown as mongoose.Types.ObjectId).toString();
  emitRequestAccepted({ senderId: senderIdStr, bookingId });
  return updated;
};

export type PayBookingBody = { paymentSignature?: string; paymentIntentId?: string };

export const payBooking = async (
  bookingId: string,
  senderId: string,
  body: PayBookingBody
): Promise<bookingRepository.BookingLean> => {
  const signature = body.paymentSignature ?? body.paymentIntentId ?? "";
  if (!signature.trim()) {
    throw createError("Payment signature or intent ID is required", HTTP_STATUS.BAD_REQUEST);
  }

  const { booking } = await validateBookingReadyForPayment(bookingId, senderId);

  const sender = await User.findById(senderId).select("stripeCustomerId").lean().exec();
  await assertPaymentIntentMatchesBooking({
    paymentIntentId: signature.trim(),
    bookingId,
    senderId,
    agreedPriceDollars: booking.agreedPrice,
    stripeCustomerId: sender ? (sender as { stripeCustomerId?: string }).stripeCustomerId : null,
  });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Transaction.create(
      [
        {
          bookingId: booking._id,
          amount: booking.agreedPrice,
          status: "completed",
          paymentIntentId: signature,
        },
      ],
      { session }
    );

    await bookingRepository.atomicConfirmAndDeductCapacity(
      session,
      bookingId,
      (booking.tripId as unknown as mongoose.Types.ObjectId).toString(),
      booking.parcel.weight,
      signature
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  const updated = await bookingRepository.findById(bookingId);
  if (!updated) throw createError("Booking not found after payment", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  emitPaymentSucceeded({ senderId, bookingId });
  return updated;
};

const LIVE_STATUSES = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PICKED_UP];
const COMPLETED_STATUSES = [BOOKING_STATUS.DELIVERED];

export type MyBookingsStatusFilter = "live" | "completed";

export const listMyBookings = async (
  senderId: string,
  status: MyBookingsStatusFilter
): Promise<bookingRepository.BookingLean[]> => {
  const statuses = status === "live" ? LIVE_STATUSES : COMPLETED_STATUSES;
  return bookingRepository.findBySenderIdAndStatuses(senderId, statuses);
};

/** Trip rider: bookings on their trips with status `delivered` (newest first). */
export const listRiderCompletedBookings = async (
  riderUserId: string
): Promise<bookingRepository.RiderActiveBookingLean[]> =>
  bookingRepository.findDeliveredByTripRiderId(riderUserId);
