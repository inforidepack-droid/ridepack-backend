import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import {
  createBooking,
  acceptBookingRequest,
  payBooking,
  listMyBookings,
} from "@/modules/booking/booking.service";
import { createBookingPaymentIntent } from "@/modules/booking/booking.payment.service";
import type {
  CreateBookingBody,
  PayBookingBody,
  MyBookingsStatusFilter,
} from "@/modules/booking/booking.service";
import { AuthRequest } from "@/middlewares/auth";

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
