import { Router } from "express";
import {
  createDraftTripController,
  publishTripController,
  searchTripsController,
  getTripDetailsController,
  getPriceBreakdownController,
  listMyPublishedTripsController,
  cancelTripController,
} from "@/modules/trip/trip.controller";
import { createDraftValidation } from "@/modules/trip/trip.validation";
import {
  searchTripsValidation,
  priceBreakdownValidation,
  cancelTripValidation,
} from "@/modules/trip/trip.validation";
import { validate } from "@/middlewares/validation";
import { authenticate } from "@/middlewares/auth";

const router = Router();

router.get("/search", searchTripsValidation(), validate, searchTripsController);
router.get("/my/published", authenticate, listMyPublishedTripsController);
router.get("/:tripId/price-breakdown", priceBreakdownValidation(), validate, getPriceBreakdownController);
router.get("/:tripId", getTripDetailsController);

router.post("/", authenticate, createDraftValidation(), validate, createDraftTripController);
router.patch("/:tripId/publish", authenticate, publishTripController);
router.patch("/:tripId/cancel", authenticate, cancelTripValidation(), validate, cancelTripController);

export default router;
