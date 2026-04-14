import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import {
  publishTrip,
  createDraftTrip,
  listMyPublishedTrips,
} from "@/modules/trip/trip.service";
import { cancelTrip } from "@/modules/trip/trip.cancel.service";
import { startTrip } from "@/modules/trip/trip.start.service";
import { searchTrips, getTripDetails, getPriceBreakdown } from "@/modules/trip/trip.search.service";
import { AuthRequest } from "@/middlewares/auth";

export const createDraftTripController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const trip = await createDraftTrip(req.user.userId, req.body);
    sendCreated(res, { data: { trip }, message: "Draft trip created" });
  }
);

export const publishTripController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);

    const tripId = req.params.tripId as string;
    const riderId = req.user.userId;

    const trip = await publishTrip(tripId, riderId);

    sendSuccess(res, {
      message: "Trip published successfully",
      data: { trip },
    });
  }
);

export const startTripController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const tripId = req.params.tripId as string;
    const trip = await startTrip(req.user.userId, tripId);
    sendSuccess(res, {
      data: { trip },
      message: "Trip started — status is now in_progress",
    });
  }
);

export const searchTripsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const results = await searchTrips(req.query as import("@/modules/trip/trip.search.service").SearchQuery);
    sendSuccess(res, { data: results });
  }
);

export const getTripDetailsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tripId = req.params.tripId as string;
    const trip = await getTripDetails(tripId);
    sendSuccess(res, { data: trip });
  }
);

export const getPriceBreakdownController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tripId = req.params.tripId as string;
    const breakdown = await getPriceBreakdown(tripId, req.query as import("@/modules/trip/trip.search.service").PriceBreakdownQuery);
    sendSuccess(res, { data: breakdown });
  }
);

export const listMyPublishedTripsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const trips = await listMyPublishedTrips(req.user.userId);
    sendSuccess(res, { data: { trips } });
  }
);

export const cancelTripController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", 401);
    const tripId = req.params.tripId as string;
    const riderId = req.user.userId;
    const trip = await cancelTrip(riderId, tripId);
    sendSuccess(res, { data: { trip }, message: "Trip cancelled successfully" });
  }
);
