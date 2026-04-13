import { Router } from "express";
import {
  createBookingController,
  acceptBookingController,
  createBookingPaymentIntentController,
  payBookingController,
  listMyBookingsController,
  verifyPickupOtpController,
  verifyDeliveryOtpController,
  resendDeliveryOtpController,
} from "@/modules/booking/booking.controller";
import {
  createBookingValidation,
  acceptBookingValidation,
  createBookingPaymentIntentValidation,
  payBookingValidation,
  listMyBookingsValidation,
  verifyPickupOtpValidation,
  verifyDeliveryOtpValidation,
  resendDeliveryOtpValidation,
} from "@/modules/booking/booking.validation";
import { validate } from "@/middlewares/validation";
import { authenticate } from "@/middlewares/auth";
import { requireRider } from "@/modules/rider/rider.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  listMyBookingsValidation(),
  validate,
  listMyBookingsController
);
router.post("/", authenticate, createBookingValidation(), validate, createBookingController);
router.post(
  "/verify-pickup-otp",
  authenticate,
  requireRider,
  verifyPickupOtpValidation(),
  validate,
  verifyPickupOtpController
);
router.post(
  "/verify-delivery-otp",
  authenticate,
  requireRider,
  verifyDeliveryOtpValidation(),
  validate,
  verifyDeliveryOtpController
);
router.post(
  "/resend-delivery-otp",
  authenticate,
  resendDeliveryOtpValidation(),
  validate,
  resendDeliveryOtpController
);
router.post("/:id/accept", authenticate, acceptBookingValidation(), validate, acceptBookingController);
router.post(
  "/:id/payment-intent",
  authenticate,
  createBookingPaymentIntentValidation(),
  validate,
  createBookingPaymentIntentController
);
router.post("/:id/pay", authenticate, payBookingValidation(), validate, payBookingController);

export default router;
