import { Router } from "express";
import {
  createBookingController,
  acceptBookingController,
  payBookingController,
  listMyBookingsController,
} from "@/modules/booking/booking.controller";
import {
  createBookingValidation,
  acceptBookingValidation,
  payBookingValidation,
  listMyBookingsValidation,
} from "@/modules/booking/booking.validation";
import { validate } from "@/middlewares/validation";
import { authenticate } from "@/middlewares/auth";

const router = Router();

router.get(
  "/",
  authenticate,
  listMyBookingsValidation(),
  validate,
  listMyBookingsController
);
router.post("/", authenticate, createBookingValidation(), validate, createBookingController);
router.post("/:id/accept", authenticate, acceptBookingValidation(), validate, acceptBookingController);
router.post("/:id/pay", authenticate, payBookingValidation(), validate, payBookingController);

export default router;
