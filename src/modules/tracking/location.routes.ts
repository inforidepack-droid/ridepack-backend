import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";
import { updateLocationValidation } from "@/modules/tracking/tracking.validation";
import { updateLocationController } from "@/modules/tracking/location.controller";

const router = Router();

router.post(
  "/update",
  authenticate,
  updateLocationValidation(),
  validate,
  updateLocationController
);

export default router;
