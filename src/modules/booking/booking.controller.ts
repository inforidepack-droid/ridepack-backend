import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import {
  createBooking,
  acceptBookingRequest,
  payBooking,
  listMyBookings,
  listRiderCompletedBookings,
} from "@/modules/booking/booking.service";
import {
  verifyPickupOtp,
  verifyDeliveryOtp,
  resendDeliveryOtp,
} from "@/modules/booking/booking.parcelOtp.service";
import {
  riderNotifyPickupArrival,
  riderNotifyDeliveryArrival,
} from "@/modules/booking/booking.arrival.service";
import { createBookingPaymentIntent } from "@/modules/booking/booking.payment.service";
import type {
  CreateBookingBody,
  PayBookingBody,
  MyBookingsStatusFilter,
} from "@/modules/booking/booking.service";
import { AuthRequest } from "@/middlewares/auth";
import { toPublicBookingLean } from "@/modules/booking/booking.public.utils";
import type { VerifyParcelOtpBody } from "@/modules/booking/booking.parcelOtp.types";

export const createBookingController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const booking = await createBooking(req.user.userId, req.body as CreateBookingBody);
    sendCreated(res, { data: { booking }, message: "Booking created" });
  }
);

export const acceptBookingController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const bookingId = req.params.id as string;
    const booking = await acceptBookingRequest(req.user.userId, bookingId);
    sendSuccess(res, { data: { booking }, message: "Booking request accepted" });
  }
);

export const createBookingPaymentIntentController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const bookingId = req.params.id as string;
    const { paymentMethodId } = req.body as { paymentMethodId?: string };
    const result = await createBookingPaymentIntent(
      bookingId,
      req.user.userId,
      paymentMethodId
    );
    sendSuccess(res, { data: result });
  }
);

export const payBookingController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const bookingId = req.params.id as string;
    const booking = await payBooking(bookingId, req.user.userId, req.body as PayBookingBody);
    sendSuccess(res, { data: { booking }, message: "Payment successful" });
  }
);

export const listMyBookingsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const status = (req.query.status as string) as MyBookingsStatusFilter;
    const bookings = await listMyBookings(req.user.userId, status);
    sendSuccess(res, { data: { bookings } });
  }
);

export const listRiderCompletedBookingsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const bookings = await listRiderCompletedBookings(req.user.userId);
    sendSuccess(res, { data: { bookings } });
  }
);

export const verifyPickupOtpController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const { bookingId, otp } = req.body as VerifyParcelOtpBody;
    const booking = await verifyPickupOtp(req.user.userId, bookingId, otp);
    sendSuccess(res, {
      data: { booking: toPublicBookingLean(booking) },
      message: "Pickup verified",
    });
  }
);

export const verifyDeliveryOtpController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const { bookingId, otp } = req.body as VerifyParcelOtpBody;
    const booking = await verifyDeliveryOtp(req.user.userId, bookingId, otp);
    sendSuccess(res, {
      data: { booking: toPublicBookingLean(booking) },
      message: "Delivery verified",
    });
  }
);

export const resendDeliveryOtpController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const { bookingId } = req.body as { bookingId: string };
    await resendDeliveryOtp(req.user.userId, bookingId);
    sendSuccess(res, { data: { ok: true }, message: "Delivery OTP resent to receiver" });
  }
);

export const riderPickupArrivalController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const bookingId = req.params.id as string;
    const result = await riderNotifyPickupArrival(bookingId, req.user.userId);
    sendSuccess(res, { data: result, message: "Pickup arrival notification queued" });
  }
);

export const riderDeliveryArrivalController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const bookingId = req.params.id as string;
    const result = await riderNotifyDeliveryArrival(bookingId, req.user.userId);
    sendSuccess(res, { data: result, message: "Delivery arrival notification queued" });
  }
);
