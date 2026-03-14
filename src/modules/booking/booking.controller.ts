import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import {
  createBooking,
  payBooking,
  listMyBookings,
} from "@/modules/booking/booking.service";
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
