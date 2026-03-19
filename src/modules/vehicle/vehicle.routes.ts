import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";
import { requireRider } from "@/modules/rider/rider.middleware";
import {
  addVehicleController,
  deleteVehicleController,
  getMyVehiclesController,
  getVehicleByIdController,
  updateVehicleController,
} from "@/modules/vehicle/vehicle.controller";
import {
  createVehicleValidation,
  ensureVehicleUpdateHasFields,
  updateVehicleValidation,
  vehicleIdParamValidation,
} from "@/modules/vehicle/vehicle.validation";

const router = Router();

router.post("/", authenticate, requireRider, createVehicleValidation(), validate, addVehicleController);
router.get("/", authenticate, requireRider, getMyVehiclesController);
router.get("/:id", authenticate, requireRider, vehicleIdParamValidation(), validate, getVehicleByIdController);
router.put(
  "/:id",
  authenticate,
  requireRider,
  vehicleIdParamValidation(),
  updateVehicleValidation(),
  validate,
  ensureVehicleUpdateHasFields(),
  updateVehicleController
);
router.delete("/:id", authenticate, requireRider, vehicleIdParamValidation(), validate, deleteVehicleController);

export default router;

