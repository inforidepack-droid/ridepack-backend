import { Router } from "express";
import {
  createDraftTripController,
  publishTripController,
  searchTripsController,
  getTripDetailsController,
  getPriceBreakdownController,
} from "@/modules/trip/trip.controller";
import { createDraftValidation } from "@/modules/trip/trip.validation";
import { searchTripsValidation, priceBreakdownValidation } from "@/modules/trip/trip.validation";
import { validate } from "@/middlewares/validation";
import { authenticate } from "@/middlewares/auth";

const router = Router();

router.get("/search", searchTripsValidation(), validate, searchTripsController);
router.get("/:tripId/price-breakdown", priceBreakdownValidation(), validate, getPriceBreakdownController);
router.get("/:tripId", getTripDetailsController);

router.post("/", authenticate, createDraftValidation(), validate, createDraftTripController);
router.patch("/:tripId/publish", authenticate, publishTripController);

export default router;
