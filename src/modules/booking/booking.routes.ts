import { Router } from "express";
import { createBookingController, payBookingController } from "@/modules/booking/booking.controller";
import { createBookingValidation, payBookingValidation } from "@/modules/booking/booking.validation";
import { validate } from "@/middlewares/validation";
import { authenticate } from "@/middlewares/auth";

const router = Router();

router.post("/", authenticate, createBookingValidation(), validate, createBookingController);
router.post("/:id/pay", authenticate, payBookingValidation(), validate, payBookingController);

export default router;
