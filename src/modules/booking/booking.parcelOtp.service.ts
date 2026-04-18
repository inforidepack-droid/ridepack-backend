import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import User from "@/modules/auth/models/User.model";
import { generateOtp } from "@/utils/otp.generate.utils";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import * as bookingRepository from "@/modules/booking/booking.repository";
import { env } from "@/config/env.config";
import {
  DEV_STATIC_DELIVERY_OTP,
  PARCEL_OTP_MAX_ATTEMPTS,
} from "@/modules/booking/booking.parcelOtp.constants";
import { sendParcelDeliveryOtpSms } from "@/modules/booking/booking.parcelOtp.twilio";
import type { BookingLean } from "@/modules/booking/booking.repository";
import {
  assertDeliveryOtpBookingStatus,
  assertPickupOtpBookingStatus,
} from "@/modules/booking/booking.parcelOtp.guards";
import {
  emitDeliveryVerified,
  emitParcelInTransit,
  emitPickupVerified,
} from "@/events/notification.emitters";
import { findUserIdByPhoneContact } from "@/modules/notifications/userByPhone.lookup";

const tripRiderId = (
  trip: bookingRepository.BookingTripRiderForOtpLean["tripId"]
): string | null => {
  if (!trip || typeof trip !== "object" || !("riderId" in trip)) return null;
  const r = (trip as { riderId?: mongoose.Types.ObjectId }).riderId;
  return r ? r.toString() : null;
};

const assertRiderOwnsTrip = (
  booking: bookingRepository.BookingTripRiderForOtpLean,
  riderUserId: string
): void => {
  const rid = tripRiderId(booking.tripId);
  if (!rid) throw createError("Trip not found for this booking", HTTP_STATUS.NOT_FOUND);
  if (rid !== riderUserId) {
    throw createError("Only the assigned trip rider can verify this OTP", HTTP_STATUS.FORBIDDEN);
  }
};

const loadBookingForOtp = async (
  bookingId: string
): Promise<bookingRepository.BookingTripRiderForOtpLean> => {
  let booking = await bookingRepository.findByIdWithTripForParcelOtp(bookingId);
  if (!booking) throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  await bookingRepository.mergeMissingParcelOtpFields(bookingId);
  booking = await bookingRepository.findByIdWithTripForParcelOtp(bookingId);
  if (!booking) throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  return booking;
};

const ensureSenderProfilePickupOtp = async (senderId: string): Promise<string> => {
  const u = await User.findById(senderId).select("+profileOtp").lean().exec();
  if (!u) throw createError("Sender not found", HTTP_STATUS.NOT_FOUND);
  const existing = (u as { profileOtp?: string }).profileOtp;
  if (existing) return existing;
  const otp = generateOtp();
  await User.findByIdAndUpdate(senderId, { $set: { profileOtp: otp } }).exec();
  return otp;
};

export const verifyPickupOtp = async (
  riderUserId: string,
  bookingId: string,
  otp: string
): Promise<BookingLean> => {
  const booking = await loadBookingForOtp(bookingId);
  assertRiderOwnsTrip(booking, riderUserId);
  if (booking.otpVerification.pickupVerified) {
    throw createError("Pickup already verified", HTTP_STATUS.BAD_REQUEST);
  }
  assertPickupOtpBookingStatus(booking.status);
  if (booking.otpAttempts.pickup >= PARCEL_OTP_MAX_ATTEMPTS) {
    throw createError("OTP attempt limit exceeded", HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  const senderId = (booking.senderId as unknown as mongoose.Types.ObjectId).toString();
  const profileOtp = await ensureSenderProfilePickupOtp(senderId);
  if (otp !== profileOtp) {
    const inc = await bookingRepository.incrementPickupOtpAttempt(bookingId);
    if (inc === null) {
      throw createError("OTP attempt limit exceeded", HTTP_STATUS.TOO_MANY_REQUESTS);
    }
    throw createError("Invalid pickup OTP", HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await bookingRepository.finalizePickupVerification(bookingId);
  if (!updated) {
    throw createError("Pickup could not be verified (already verified or invalid state)", HTTP_STATUS.BAD_REQUEST);
  }
  emitPickupVerified({ bookingId, senderId });
  emitParcelInTransit({ bookingId });
  return updated;
};

export const verifyDeliveryOtp = async (
  riderUserId: string,
  bookingId: string,
  otp: string
): Promise<BookingLean> => {
  const booking = await loadBookingForOtp(bookingId);
  assertRiderOwnsTrip(booking, riderUserId);
  if (!booking.otpVerification.pickupVerified) {
    throw createError("Pickup must be verified before delivery OTP", HTTP_STATUS.BAD_REQUEST);
  }
  if (booking.otpVerification.deliveryVerified) {
    throw createError("Delivery already verified", HTTP_STATUS.BAD_REQUEST);
  }
  assertDeliveryOtpBookingStatus(booking.status);
  if (booking.otpAttempts.delivery >= PARCEL_OTP_MAX_ATTEMPTS) {
    throw createError("OTP attempt limit exceeded", HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  const expected = booking.deliveryOtp;
  if (!expected) {
    throw createError("Delivery OTP is not set for this booking", HTTP_STATUS.BAD_REQUEST);
  }
  if (otp !== expected) {
    const inc = await bookingRepository.incrementDeliveryOtpAttempt(bookingId);
    if (inc === null) {
      throw createError("OTP attempt limit exceeded", HTTP_STATUS.TOO_MANY_REQUESTS);
    }
    throw createError("Invalid delivery OTP", HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await bookingRepository.finalizeDeliveryVerification(bookingId);
  if (!updated) {
    throw createError(
      "Delivery could not be verified (already verified or invalid state)",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  const senderIdStr = (updated.senderId as unknown as mongoose.Types.ObjectId).toString();
  const receiverUserId = await findUserIdByPhoneContact({
    phone: updated.receiverDetails.phone,
    countryCode: updated.receiverDetails.countryCode,
  });
  emitDeliveryVerified({
    bookingId,
    senderId: senderIdStr,
    receiverUserId,
  });
  return updated;
};

export const resendDeliveryOtp = async (
  senderUserId: string,
  bookingId: string
): Promise<{ ok: true }> => {
  const booking = await loadBookingForOtp(bookingId);
  const sid = (booking.senderId as unknown as mongoose.Types.ObjectId).toString();
  if (sid !== senderUserId) {
    throw createError("Only the booking sender can resend the delivery OTP", HTTP_STATUS.FORBIDDEN);
  }
  if (booking.status === BOOKING_STATUS.DELIVERED) {
    throw createError("Booking is already delivered", HTTP_STATUS.BAD_REQUEST);
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw createError("Booking is cancelled", HTTP_STATUS.BAD_REQUEST);
  }
  if (booking.status === BOOKING_STATUS.DISPUTED) {
    throw createError("Booking is in dispute; cannot resend delivery OTP", HTTP_STATUS.BAD_REQUEST);
  }
  const plain = booking.deliveryOtp;
  if (!plain) {
    throw createError("Delivery OTP is not available for this booking", HTTP_STATUS.BAD_REQUEST);
  }
  try {
    await sendParcelDeliveryOtpSms(
      {
        phone: booking.receiverDetails.phone,
        countryCode: booking.receiverDetails.countryCode,
      },
      plain
    );
  } catch (e) {
    const msg = e instanceof Error && e.message === "INVALID_RECEIVER_PHONE" ? e.message : "SMS_SEND_FAILED";
    if (msg === "INVALID_RECEIVER_PHONE") {
      throw createError("Receiver phone is invalid for SMS delivery", HTTP_STATUS.BAD_REQUEST);
    }
    throw createError("Failed to send delivery OTP via SMS", HTTP_STATUS.BAD_GATEWAY);
  }
  return { ok: true };
};
