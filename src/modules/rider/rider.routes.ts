import { Router } from "express";
import {
  createRiderController,
  getRiderController,
  updateRiderController,
  deleteRiderController,
  getActiveRideController,
} from "@/modules/rider/rider.controller";
import {
  createRiderValidation,
  updateRiderValidation,
  activeRideValidation,
} from "@/modules/rider/rider.validation";
import { requireRider, requireStrictRider } from "@/modules/rider/rider.middleware";
import { validate } from "@/middlewares/validation";
import { authenticate } from "@/middlewares/auth";

const router = Router();

router.post(
  "/",
  authenticate,
  requireRider,
  createRiderValidation(),
  validate,
  createRiderController
);

router.get(
  "/active-ride",
  authenticate,
  requireStrictRider,
  activeRideValidation(),
  validate,
  getActiveRideController
);

router.get("/:id", getRiderController);

router.put(
  "/:id",
  authenticate,
  updateRiderValidation(),
  validate,
  updateRiderController
);

router.delete("/:id", authenticate, deleteRiderController);

export default router;
